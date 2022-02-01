'use strict';
const {app, BrowserWindow} = require('electron');
const path = require('path');
const {openNewGitHubIssue, debugInfo} = require('electron-util');
const unhandled = require('.');

unhandled({
	showDialog: true,
	reportButton: error => {
		openNewGitHubIssue({
			user: 'sindresorhus',
			repo: 'electron-unhandled',
			body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
		});
	}
});

let mainWindow;

(async () => {
	await app.whenReady();

	mainWindow = new BrowserWindow({
		webPreferences: {
			preload: path.join(__dirname, 'example-preload.js')
		}
	});
	mainWindow.openDevTools();
	await mainWindow.loadURL('https://google.com');
})();
