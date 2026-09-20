import assert from 'node:assert';
import {app, dialog} from 'electron';
import unhandled, {logError} from './index.js';

const dialogs = [];

// Capture the dialog instead of showing it, so the test can assert on it
dialog.showMessageBoxSync = options => {
	dialogs.push(options);
	return 0;
};

unhandled({
	showDialog: true,
	message: message => `Please contact support: ${message}`,
});

// A top-level `await app.whenReady()` never resolves in an ES module main process, because Electron emits the `ready` event only after the entry module is evaluated
// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	logError(new Error('From logError'), {title: 'Save failed'});

	setTimeout(() => {
		throw new Error('From an unhandled error');
	}, 10);

	setTimeout(() => {
		try {
			assert.strictEqual(dialogs.length, 2);
			assert.strictEqual(dialogs[0].message, 'Please contact support: Save failed');
			assert.strictEqual(dialogs[1].message, 'Please contact support: Unhandled Error');
			app.quit();
		} catch (error) {
			console.error(error);
			app.exit(1);
		}
	}, 500);
})();
