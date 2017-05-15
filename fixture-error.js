'use strict';
const assert = require('assert');
const electron = require('electron');
const unhandled = require('.');

const fixture = new Error('foo');

unhandled({
	showDialog: false,
	logger: err => {
		assert.strictEqual(err.message, fixture.message);
		electron.app.quit();
	}
});

setTimeout(() => {
	throw fixture;
}, 50);
