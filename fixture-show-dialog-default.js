import assert from 'node:assert';
import {app, dialog} from 'electron';
import unhandled from './index.js';

const calls = [];
const dialogs = [];

// Capture the dialogs instead of showing them, so the test can assert that there are none
dialog.showMessageBoxSync = options => {
	dialogs.push(options);
	return 0;
};

dialog.showErrorBox = (title, content) => {
	dialogs.push({title, content});
};

// No options, so the defaults apply
unhandled({
	logger(error) {
		calls.push(error.message);
	},
});

const fixture = new Error('foo');

setTimeout(() => {
	throw fixture;
}, 50);

setTimeout(() => {
	try {
		assert.deepStrictEqual(calls, ['foo']);
		// The default is to show the dialog only in production, and this is not a packaged app
		assert.deepStrictEqual(dialogs, []);
		app.quit();
	} catch (error) {
		console.error(error);
		app.exit(1);
	}
}, 1000);
