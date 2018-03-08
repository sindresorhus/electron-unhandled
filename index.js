'use strict';
const noop = x => x;

const electron = require('electron');
const cleanStack = noop;
const ensureError = noop;

const app = electron.app || electron.remote.app;
const dialog = electron.dialog || electron.remote.dialog;
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
		err = ensureError(err);

		try {
			options.logger(err);
		} catch (err2) { // eslint-disable-line unicorn/catch-error-name
			dialog.showErrorBox('The `logger` option function in electron-unhandled threw an error', ensureError(err2).stack);
			return;
		}

		if (options.showDialog) {
			const stack = cleanStack(err.stack);

			if (app.isReady()) {
				// Intentionally not using the `title` option as it's not shown on macOS
				const btnIndex = dialog.showMessageBox({
					type: 'error',
					buttons: [
						'OK',
						process.platform === 'darwin' ? 'Copy Error' : 'Copy error'
					],
					defaultId: 0,
					noLink: true,
					message: title,
					detail: cleanStack(err.stack, {pretty: true})
				});

				if (btnIndex === 1) {
					clipboard.writeText(`${title}\n${stack}`);
				}
			} else {
				dialog.showErrorBox(title, stack);
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
