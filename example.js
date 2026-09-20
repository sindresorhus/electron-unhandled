import {app, BrowserWindow} from 'electron';
import path from 'node:path';
import {openNewGitHubIssue} from 'electron-util';
import {debugInfo} from 'electron-util/main';
import unhandled from './index.js';

// Without this the app name is "Electron", because the app is started from a file and not from a directory
app.setName('electron-unhandled');

unhandled({
	showDialog: true,
	reportButton(error) {
		openNewGitHubIssue({
			user: 'sindresorhus',
			repo: 'electron-unhandled',
			body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`,
		});
	},
});

let mainWindow;

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	mainWindow = new BrowserWindow({
		webPreferences: {
			preload: path.join(import.meta.dirname, 'example-preload.mjs'),
			// Needed because the preload is an ES module
			sandbox: false,
		},
	});

	mainWindow.openDevTools();

	await mainWindow.loadURL('https://google.com');
})();
