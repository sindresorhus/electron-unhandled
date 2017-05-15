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
		options.logger(err);

		if (options.showDialog) {
			const showErrorBox = (electron.dialog || electron.remote.dialog).showErrorBox;
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
