import {app, BrowserWindow} from 'electron';
import path from 'node:path';
import {openNewGitHubIssue} from 'electron-util';
import {debugInfo} from 'electron-util/main';
import unhandled from './index.js';

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
		},
	});

	mainWindow.openDevTools();

	await mainWindow.loadURL('https://google.com');
})();
