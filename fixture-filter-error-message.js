'use strict';
const assert = require('assert');
const electron = require('electron');
const unhandled = require('.');

const fixture = new Error('testError');

unhandled({
	showDialog: false,
	logger: error => {
		assert.strictEqual(error.message, fixture.message);
		electron.app.quit();
	}
});

Promise.reject(fixture);
