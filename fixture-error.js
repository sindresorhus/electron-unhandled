import assert from 'node:assert';
import {app} from 'electron';
import {failTestOnDialog} from './fixture-dialog-guard.mjs';
import unhandled from './index.js';

const fixture = new Error('foo');

failTestOnDialog();

unhandled({
	showDialog: false,
	logger(error) {
		assert.strictEqual(error.message, fixture.message);
		app.quit();
	},
});

setTimeout(() => {
	throw fixture;
}, 50);
