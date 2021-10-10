'use strict';
const assert = require('assert');
const electron = require('electron');
const unhandled = require('.');

const fixture = new Error('foo');

unhandled({
	showDialog: false,
	filter: error => {
		assert.strictEqual(error.message, fixture.message);
		electron.app.quit();
	}
});

Promise.reject(fixture);
