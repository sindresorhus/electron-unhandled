'use strict';
const electron = require('electron');
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
	await electron.app.whenReady();

	mainWindow = new electron.BrowserWindow();
	mainWindow.loadURL('https://google.com');

	unhandled.logError(new Error('Test'));
})();
