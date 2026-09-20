import {app, dialog} from 'electron';

/*	An assertion that fails inside the `logger` option is caught by the module and shown in an error
	dialog, which blocks the process until the test times out. Fail the test instead. */
export const failTestOnDialog = () => {
	dialog.showErrorBox = (title, content) => {
		console.error(title, content);
		app.exit(1);
	};
};
