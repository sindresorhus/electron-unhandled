import assert from 'node:assert';
import path from 'node:path';
import {app, BrowserWindow, dialog} from 'electron';
import unhandled from './index.js';

const dialogs = [];

// Capture the dialog instead of showing it, so the test can assert on it
dialog.showMessageBoxSync = options => {
	dialogs.push(options);
	return 0;
};

unhandled({showDialog: true});

// A top-level `await app.whenReady()` never resolves in an ES module main process, because Electron emits the `ready` event only after the entry module is evaluated
// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	const window = new BrowserWindow({
		show: false,
		webPreferences: {
			preload: path.join(import.meta.dirname, 'fixture-renderer-non-serializable-preload.mjs'),
			sandbox: false,
		},
	});

	await window.loadURL('data:text/html,<h1>Renderer</h1>');

	// A renderer cannot send a value that the IPC channel cannot clone, so it sends the serialized error
	setTimeout(() => {
		try {
			assert.strictEqual(dialogs.length, 1);
			// The title of a renderer uses the app name, like the title of the main process
			assert.strictEqual(dialogs[0].message, `${app.getName()} encountered an error`);
			// A value that is not an error has no stack trace of the app, so the dialog shows the message without a stack trace
			assert.strictEqual(dialogs[0].detail, 'NonError: Symbol(Tests handling of non-serializable values)');
			app.quit();
		} catch (error) {
			console.error(error);
			app.exit(1);
		}
	}, 500);
})();
