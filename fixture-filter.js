import assert from 'node:assert';
import {app} from 'electron';
import unhandled from './index.js';

const fixture = new Error('foo');
const calls = [];

unhandled({
	showDialog: false,
	filter(error) {
		calls.push(`filter:${error.message}`);
		return true;
	},
	logger(error) {
		calls.push(`logger:${error.message}`);
	},
});

Promise.reject(fixture);

setTimeout(() => {
	try {
		assert.deepStrictEqual(calls, ['filter:foo']);
		app.quit();
	} catch (error) {
		console.error(error);
		app.exit(1);
	}
}, 1000);
