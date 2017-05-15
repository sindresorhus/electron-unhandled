'use strict';
const electron = require('electron');
const cleanStack = require('clean-stack');

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
		const showErrorBox = (electron.dialog || electron.remote.dialog).showErrorBox;

		try {
			options.logger(err);
		} catch (err2) { // eslint-disable-line unicorn/catch-error-name
			showErrorBox('The function specified in the `logger` option in electron-unhandled threw an error', err2.stack);
			return;
		}

		if (options.showDialog) {
			const stack = err ? (err.stack || err.message || err || '[No error message]') : '[Undefined error]';
			showErrorBox(title, cleanStack(stack));
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
