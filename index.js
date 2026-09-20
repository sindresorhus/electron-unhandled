import process from 'node:process';
import cleanStack from 'clean-stack';
import ensureError from 'ensure-error';
import debounce from 'lodash.debounce';
import {serializeError, deserializeError} from 'serialize-error';

let appName;
let invokeErrorHandler;
let app;
let dialog;
let clipboard;
// A renderer process cannot show a dialog
let shouldShowDialog = process.type !== 'renderer';

const ERROR_HANDLER_CHANNEL = 'electron-unhandled.ERROR';

const rendererCrashReasons = new Set([
	'crashed',
	'abnormal-exit',
	'oom',
	'launch-failed',
	'integrity-failure',
]);

/*	The main process modules are imported here and not at the top level because
	renderer processes only expose `ipcRenderer` and a few other modules. */
if (process.type === 'renderer') {
	//	`title` can be undefined here, because only the main process knows the app name. The error handler applies the default.
	invokeErrorHandler = async (title, error, options) => {
		const {ipcRenderer} = await import('electron');

		try {
			await ipcRenderer.invoke(ERROR_HANDLER_CHANNEL, title, error, options);
		} catch (invokeError) {
			if (invokeError.message === 'An object could not be cloned.') {
				// 1. If serialization failed, force the passed arg to an error format
				error = ensureError(error);

				// 2. Then attempt serialization on each property, defaulting to undefined otherwise
				const serialized = serializeError(error);
				// 3. Invoke the error handler again with only the serialized error properties
				ipcRenderer.invoke(ERROR_HANDLER_CHANNEL, title, serialized, options);
			}
		}
	};
} else {
	const electron = await import('electron');
	app = electron.app;
	dialog = electron.dialog;
	clipboard = electron.clipboard;

	appName = 'name' in app ? app.name : app.getName();

	// `electron-is-dev` uses the `app` module, so it can only be loaded in the main process. It is awaited here because `handleError` needs the value synchronously.
	const {default: isDevelopment} = await import('electron-is-dev');
	// The default is to show the dialog only in production. The `showDialog` option can override it.
	shouldShowDialog = !isDevelopment;

	electron.ipcMain.handle(ERROR_HANDLER_CHANNEL, async (event_, title, error, options) => {
		// A renderer that cannot send the error itself sends the serialized form of it
		handleError(title, deserializeError(error), options);
	});
}

let isInstalled = false;

let options = {
	logger: console.error,
	showDialog: shouldShowDialog,
};

// The default title uses the app name, which only the main process knows, so a renderer leaves the title undefined
const handleError = (title = `${appName} encountered an error`, error, {showStackTrace = options.showStackTrace !== false} = {}) => {
	error = ensureError(error);

	if (options.filter?.(error)) {
		return;
	}

	try {
		options.logger(error);
	} catch (loggerError) {
		dialog.showErrorBox('The `logger` option function in electron-unhandled threw an error', ensureError(loggerError).stack);
		return;
	}

	if (!options.showDialog) {
		return;
	}

	// The `message` option can rewrite the message of the dialog, for example to add a prefix or to translate it
	if (options.message) {
		title = options.message(title);
	}

	/*	The stack trace of the error is shown when it points at code of the app. It does not for a value that is
		not an error, because `ensure-error` wraps that value in a `NonError` at the place where it wraps it.
		The first line of a stack trace is the type and the message of the error, so it stands alone. */
	const errorDescription = `${error.name}: ${error.message}`;
	const shouldShowStack = showStackTrace && error.name !== 'NonError';

	const stack = cleanStack(error.stack);

	if (!app.isReady()) {
		dialog.showErrorBox(title, shouldShowStack ? stack : errorDescription);
		return;
	}

	const buttons = [
		'OK',
		process.platform === 'darwin' ? 'Copy Error' : 'Copy error',
		...(options.reportButton ? ['Report…'] : []),
	];

	// Intentionally not setting the `title` of the dialog, because macOS ignores it. The message is passed as `message`.
	const buttonIndex = dialog.showMessageBoxSync({
		type: 'error',
		buttons,
		defaultId: 0,
		noLink: true,
		message: title,
		detail: shouldShowStack ? cleanStack(error.stack, {pretty: true}) : errorDescription,
	});

	if (buttonIndex === 1) {
		clipboard.writeText(shouldShowStack ? `${title}\n${stack}` : `${title}\n${errorDescription}`);
	} else if (buttonIndex === 2) {
		options.reportButton(error);
	}
};

/*	Some error events have no error object, for example a script error from another origin.
	Use the message of the event instead, so the error is readable. */
const errorFromErrorEvent = event => new Error(event.message || 'Unknown error');

// The event of a renderer process has no stack trace of the app to show, so only report the message
const reportRendererError = (title, message) => {
	handleError(title, new Error(message), {showStackTrace: false});
};

// A page has no URL before it has loaded, for example when its renderer crashes during startup
const pageDescription = webContents => {
	const url = webContents.getURL();
	return url ? `The page for "${url}"` : 'A page';
};

export default function unhandled(inputOptions) {
	if (isInstalled) {
		return;
	}

	isInstalled = true;

	options = {
		...options,
		...inputOptions,
	};

	if (process.type === 'renderer') {
		//	Coalesce errors over 200 ms, because some packages, for example React, throw many uncaught errors in a burst for one problem. Only the last error of a burst is reported.
		const errorHandler = debounce(error => {
			invokeErrorHandler('Unhandled Error', error);
		}, 200);
		globalThis.addEventListener('error', event => {
			event.preventDefault();
			errorHandler(event.error || errorFromErrorEvent(event));
		});

		const rejectionHandler = debounce(reason => {
			invokeErrorHandler('Unhandled Promise Rejection', reason);
		}, 200);
		globalThis.addEventListener('unhandledrejection', event => {
			event.preventDefault();
			rejectionHandler(event.reason);
		});
	} else {
		process.on('uncaughtException', error => {
			handleError('Unhandled Error', error);
		});

		process.on('unhandledRejection', error => {
			handleError('Unhandled Promise Rejection', error);
		});

		app.on('render-process-gone', (event, webContents, details) => {
			// The other reasons mean that the renderer did not fail, for example a window that was closed, a renderer that the app killed, or memory the system reclaimed
			if (!rendererCrashReasons.has(details.reason)) {
				return;
			}

			reportRendererError(`${pageDescription(webContents)} crashed`, `The renderer process exited with reason "${details.reason}" (exit code: ${details.exitCode})`);
		});

		app.on('web-contents-created', (event, webContents) => {
			let isUnresponsive = false;

			webContents.on('unresponsive', () => {
				// The event repeats while the page stays unresponsive, so report it only once
				if (isUnresponsive) {
					return;
				}

				isUnresponsive = true;
				reportRendererError(`${pageDescription(webContents)} is not responding`, 'The renderer process did not respond to an input event');
			});

			webContents.on('responsive', () => {
				isUnresponsive = false;
			});
		});
	}
}

export function logError(error, {title, showStackTrace} = {}) {
	if (typeof invokeErrorHandler === 'function') {
		invokeErrorHandler(title, error, {showStackTrace});
	} else {
		handleError(title, error, {showStackTrace});
	}
}
