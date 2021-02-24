'use strict';
const {app, dialog, clipboard} = require('electron');
const cleanStack = require('clean-stack');
const ensureError = require('ensure-error');
const debounce = require('lodash.debounce');
const isDev = require('electron-is-dev');

let appName;

let invokeErrorHandler;

const ERROR_HANDLER_CHANNEL = 'electron-unhandled.ERROR';

if (process.type === 'renderer') {
	const {ipcRenderer} = require('electron');
	invokeErrorHandler = async (...args) => ipcRenderer.invoke(ERROR_HANDLER_CHANNEL, ...args);
} else {
	appName = 'name' in app ? app.name : app.getName();
	const {ipcMain} = require('electron');
	ipcMain.handle(ERROR_HANDLER_CHANNEL, async (evt, ...args) => {
		handleError(...args);
	});
}

// The dialog.showMessageBox method has been split into a sync and an async variant in Electron 6.0.0
const showMessageBox = dialog.showMessageBoxSync || dialog.showMessageBox;

let installed = false;

let options = {
	logger: console.error,
	showDialog: !isDev
};

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
			const buttonIndex = showMessageBox({
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

	handleError(options.title, error);
};
