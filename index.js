import process from 'node:process';
import cleanStack from 'clean-stack';
import ensureError from 'ensure-error';
import debounce from 'lodash.debounce';
import {serializeError} from 'serialize-error';

let appName;
let invokeErrorHandler;
let app;
let dialog;
let clipboard;
// A renderer process cannot show a dialog
let shouldShowDialog = process.type !== 'renderer';

const ERROR_HANDLER_CHANNEL = 'electron-unhandled.ERROR';

/*	The main process modules are imported here and not at the top level because
	renderer processes only expose `ipcRenderer` and a few other modules. */
if (process.type === 'renderer') {
	//	Default to 'App' because I don't think we can populate `appName` reliably here without remote or adding more IPC logic
	invokeErrorHandler = async (title = 'App encountered an error', error) => {
		const {ipcRenderer} = await import('electron');

		try {
			await ipcRenderer.invoke(ERROR_HANDLER_CHANNEL, title, error);
		} catch (invokeError) {
			if (invokeError.message === 'An object could not be cloned.') {
				// 1. If serialization failed, force the passed arg to an error format
				error = ensureError(error);

				// 2. Then attempt serialization on each property, defaulting to undefined otherwise
				const serialized = serializeError(error);
				// 3. Invoke the error handler again with only the serialized error properties
				ipcRenderer.invoke(ERROR_HANDLER_CHANNEL, title, serialized);
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

	electron.ipcMain.handle(ERROR_HANDLER_CHANNEL, async (event_, title, error) => {
		handleError(title, error);
	});
}

let isInstalled = false;

let options = {
	logger: console.error,
	showDialog: shouldShowDialog,
};

// NOTE: The ES6 default for title will only be used if the error is invoked from the main process directly. When invoked via the renderer, it will use the ES6 default from invokeErrorHandler
const handleError = (title = `${appName} encountered an error`, error) => {
	error = ensureError(error);

	try {
		options.logger(error);
	} catch (loggerError) {
		dialog.showErrorBox('The `logger` option function in electron-unhandled threw an error', ensureError(loggerError).stack);
		return;
	}

	if (!options.showDialog) {
		return;
	}

	const stack = cleanStack(error.stack);

	if (!app.isReady()) {
		dialog.showErrorBox(title, stack);
		return;
	}

	const buttons = [
		'OK',
		process.platform === 'darwin' ? 'Copy Error' : 'Copy error',
		...(options.reportButton ? ['Report…'] : []),
	];

	// Intentionally not using the `title` option as it's not shown on macOS
	const buttonIndex = dialog.showMessageBoxSync({
		type: 'error',
		buttons,
		defaultId: 0,
		noLink: true,
		message: title,
		detail: cleanStack(error.stack, {pretty: true}),
	});

	if (buttonIndex === 1) {
		clipboard.writeText(`${title}\n${stack}`);
	} else if (buttonIndex === 2) {
		options.reportButton(error);
	}
};

/*	Some error events have no error object, for example a script error from another origin.
	Use the message of the event instead, so the error is readable. */
const errorFromErrorEvent = event => new Error(event.message || 'Unknown error');

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
		//	Debounced because some packages, for example React, because of their error boundry feature, throws many identical uncaught errors
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
	}
}

export function logError(error, {title} = {}) {
	if (typeof invokeErrorHandler === 'function') {
		invokeErrorHandler(title, error);
	} else {
		handleError(title, error);
	}
}
