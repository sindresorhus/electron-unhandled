import assert from 'node:assert';
import {app} from 'electron';
import unhandled from './index.js';

const fixture = new Error('foo');

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
