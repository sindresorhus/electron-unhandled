'use strict';
const {app, dialog, clipboard} = require('electron');
const cleanStack = require('clean-stack');
const ensureError = require('ensure-error');
const debounce = require('lodash.debounce');
const {serialize} = require('v8');

let appName;

let invokeErrorHandler;

const ERROR_HANDLER_CHANNEL = 'electron-unhandled.ERROR';

const tryMakeSerialized = arg => {
	try {
		const serialized = serialize(arg);
		if (serialized) return serialized;
	} catch {}
}

if (process.type === 'renderer') {
	const {ipcRenderer} = require('electron');
	//	Default to 'App' because I don't think we can populate `appName` reliably here without remote or adding more IPC logic
	invokeErrorHandler = async (title = `App encountered an error`, error) => {
	 try {
		await ipcRenderer.invoke(ERROR_HANDLER_CHANNEL, title, error);
		return
		} catch (invokeErr) {
			if (invokeErr.message === 'An object could not be cloned.') {
				// 1. If serialization failed, force the passed arg to an error format
				error = ensureError(error)

				// 2. Then attempt serialization on each property, defaulting to undefined otherwise
				const serialized = {
					name: tryMakeSerialized(error.name),
					message: tryMakeSerialized(error.message),
					stack: tryMakeSerialized(error.stack),
				};
				// 3. Invoke the error handler again with only the serialized error properties
				ipcRenderer.invoke(ERROR_HANDLER_CHANNEL, title, serialized);
			}
		}
	}
} else {
	appName = 'name' in app ? app.name : app.getName();
	const {ipcMain} = require('electron');
	ipcMain.handle(ERROR_HANDLER_CHANNEL, async (evt, title, error) => {
		handleError(title, error);
	});
}

let installed = false;

let options = {
	logger: console.error,
	showDialog: process.type !== 'renderer' && !require('electron-is-dev')
};

// NOTE: The ES6 default for title will only be used if the error is invoked from the main process directly. When invoked via the renderer, it will use the ES6 default from invokeErrorHandler
const handleError = (title = `${appName} encountered an error`, error) => {
	error = ensureError(error);

	try {
		options.logger(error);
	} catch (loggerError) { // eslint-disable-line unicorn/catch-error-name
		dialog.showErrorBox('The `logger` option function in electron-unhandled threw an error', ensureError(loggerError).stack);
		return;
	}

	if (options.showDialog) {
		const stack = cleanStack(error.stack);

		if (app.isReady()) {
			const buttons = [
				'OK',
				process.platform === 'darwin' ? 'Copy Error' : 'Copy error'
			];

			if (options.reportButton) {
				buttons.push('Report…');
			}

			// Intentionally not using the `title` option as it's not shown on macOS
			const buttonIndex = dialog.showMessageBoxSync({
				type: 'error',
				buttons,
				defaultId: 0,
				noLink: true,
				message: title,
				detail: cleanStack(error.stack, {pretty: true})
			});

			if (buttonIndex === 1) {
				clipboard.writeText(`${title}\n${stack}`);
			}

			if (buttonIndex === 2) {
				options.reportButton(error);
			}
		} else {
			dialog.showErrorBox(title, stack);
		}
	}
};

module.exports = inputOptions => {
	if (installed) {
		return;
	}

	installed = true;

	options = {
		...options,
		...inputOptions
	};

	if (process.type === 'renderer') {
		//	Debounced because some packages, for example React, because of their error boundry feature, throws many identical uncaught errors
		const errorHandler = debounce(error => {
			invokeErrorHandler('Unhandled Error', error);
		}, 200);
		window.addEventListener('error', event => {
			event.preventDefault();
			errorHandler(event.error || event);
		});

		const rejectionHandler = debounce(reason => {
			invokeErrorHandler('Unhandled Promise Rejection', reason);
		}, 200);
		window.addEventListener('unhandledrejection', event => {
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
};

module.exports.logError = (error, options) => {
	options = {
		...options
	};

	if (typeof invokeErrorHandler === 'function') {
		invokeErrorHandler(options.title, error);
	} else {
		handleError(options.title, error);
	}
};
