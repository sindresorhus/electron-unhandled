'use strict';
const electron = require('electron');
const cleanStack = require('clean-stack');
const extractStack = require('extract-stack');

const clipboard = electron.clipboard || electron.remote.clipboard;

let installed = false;

module.exports = options => {
	if (installed) {
		return;
	}

	installed = true;

	options = Object.assign({
		logger: console.error,
		showDialog: true
	}, options);

	const handleError = (title, err) => {
		const isReady = (electron.app || electron.remote.app).isReady();
		const dialog = (electron.dialog || electron.remote.dialog);

		try {
			options.logger(err);
		} catch (err2) { // eslint-disable-line unicorn/catch-error-name
			dialog.showErrorBox('The function specified in the `logger` option in electron-unhandled threw an error', err2.stack);
			return;
		}

		if (options.showDialog) {
			const stack = err ? (err.stack || err.message || err || '[No error message]') : '[Undefined error]';
			const message = err ? (err.message || err || '[No error message]') : '[Undefined error]';

			if (isReady) {
				const btnIndex = dialog.showMessageBox({
					type: 'error',
					buttons: [process.platform === 'darwin' ? 'Copy Error' : 'Copy error', 'OK'],
					defaultId: 1,
					title,
					message,
					noLink: true,
					detail: extractStack(err)
				});
				if (btnIndex === 0) {
					clipboard.writeText(cleanStack(stack));
				}
			} else {
				dialog.showErrorBox(title, cleanStack(stack));
			}
		}
	};

	if (process.type === 'renderer') {
		window.addEventListener('error', event => {
			handleError('Unhandled Error', event.error);
		});

		window.addEventListener('unhandledrejection', event => {
			handleError('Unhandled Promise Rejection', event.reason);
		});
	} else {
		process.on('uncaughtException', err => {
			handleError('Unhandled Error', err);
		});

		process.on('unhandledRejection', err => {
			handleError('Unhandled Promise Rejection', err);
		});
	}
};
