import assert from 'node:assert';
import path from 'node:path';
import {
	app,
	BrowserWindow,
	clipboard,
	dialog,
} from 'electron';
import unhandled, {logError} from './index.js';

const dialogs = [];
const copied = [];

// Capture the dialog instead of showing it, and press the "Copy Error" button
dialog.showMessageBoxSync = options => {
	dialogs.push(options);
	return 1;
};

// Capture the copy instead of writing to the clipboard of the user
clipboard.writeText = text => {
	copied.push(text);
};

unhandled({showDialog: true});

// A top-level `await app.whenReady()` never resolves in an ES module main process, because Electron emits the `ready` event only after the entry module is evaluated
// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	logError(new Error('With a stack trace'), {title: 'Title'});
	logError(new Error('Without a stack trace'), {title: 'Title', showStackTrace: false});

	const window = new BrowserWindow({
		show: false,
		webPreferences: {
			preload: path.join(import.meta.dirname, 'fixture-show-stack-trace-preload.mjs'),
			sandbox: false,
		},
	});

	await window.loadURL('data:text/html,<h1>Renderer</h1>');

	// The error of the renderer is sent to the main process, which shows the dialog
	setTimeout(() => {
		try {
			assert.strictEqual(dialogs.length, 3);
			assert.strictEqual(typeof dialogs[0].detail, 'string');
			assert.strictEqual(dialogs[1].detail, 'Error: Without a stack trace');
			assert.strictEqual(dialogs[2].detail, 'Error: From a renderer');

			assert.ok(copied[0].startsWith('Title\nError: With a stack trace\n'));
			assert.ok(copied[0].includes('\n    at '));
			assert.strictEqual(copied[1], 'Title\nError: Without a stack trace');
			assert.strictEqual(copied[2], 'From a renderer\nError: From a renderer');

			app.quit();
		} catch (error) {
			console.error(error);
			app.exit(1);
		}
	}, 500);
})();
