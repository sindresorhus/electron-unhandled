import assert from 'node:assert';
import {app, BrowserWindow, dialog} from 'electron';
import unhandled from './index.js';

const dialogs = [];
const reports = [];

// Capture the dialog instead of showing it, so the test can assert on it
dialog.showMessageBoxSync = options => {
	dialogs.push(options);
	return 0;
};

unhandled({
	showDialog: true,
	logger(error) {
		reports.push(error.message);
	},
});

// A top-level `await app.whenReady()` never resolves in an ES module main process, because Electron emits the `ready` event only after the entry module is evaluated
// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	const window = new BrowserWindow({show: false});
	await window.loadURL('data:text/html,<h1>Renderer</h1>');

	// A page that stops responding is reported once, until it responds again
	window.webContents.emit('unresponsive');
	window.webContents.emit('unresponsive');
	window.webContents.emit('responsive');
	window.webContents.emit('unresponsive');

	// The reasons that mean the renderer did not fail are not reported
	app.emit('render-process-gone', {}, window.webContents, {reason: 'clean-exit', exitCode: 0});
	app.emit('render-process-gone', {}, window.webContents, {reason: 'memory-eviction', exitCode: 0});
	app.emit('render-process-gone', {}, window.webContents, {reason: 'crashed', exitCode: 1});

	try {
		const description = `The page for "${window.webContents.getURL()}"`;

		assert.deepStrictEqual(reports, [
			'The renderer process did not respond to an input event',
			'The renderer process did not respond to an input event',
			'The renderer process exited with reason "crashed" (exit code: 1)',
		]);

		// The dialog shows the message and the error, and not a stack trace of the library
		assert.deepStrictEqual(dialogs.map(({message, detail}) => [message, detail]), [
			[`${description} is not responding`, 'Error: The renderer process did not respond to an input event'],
			[`${description} is not responding`, 'Error: The renderer process did not respond to an input event'],
			[`${description} crashed`, 'Error: The renderer process exited with reason "crashed" (exit code: 1)'],
		]);

		app.quit();
	} catch (error) {
		console.error(error);
		app.exit(1);
	}
})();
