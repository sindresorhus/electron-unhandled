import assert from 'node:assert';
import path from 'node:path';
import {app, BrowserWindow} from 'electron';
import {failTestOnDialog} from './fixture-dialog-guard.mjs';
import unhandled from './index.js';

failTestOnDialog();

unhandled({
	showDialog: false,
	logger(error) {
		assert.strictEqual(error.message, 'Renderer error');
		app.quit();
	},
});

// A top-level `await app.whenReady()` never resolves in an ES module main process, because Electron emits the `ready` event only after the entry module is evaluated
// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	const window = new BrowserWindow({
		show: false,
		webPreferences: {
			preload: path.join(import.meta.dirname, 'fixture-renderer-preload.mjs'),
			sandbox: false,
		},
	});

	await window.loadURL('data:text/html,<h1>Renderer</h1>');
})();
