/**
__Note:__ Options can only be specified in the `main` process.
*/
export type UnhandledOptions = {
	/**
	Custom logger that receives the error.

	Can be useful if you for example integrate with Sentry.

	Use it to run your own code for an error, for example to restart the app:

	@example
	```
	import {app} from 'electron';
	import unhandled from 'electron-unhandled';

	unhandled({
		logger(error) {
			console.error(error);
			app.relaunch();
			app.exit();
		}
	});
	```

	@default console.error
	*/
	readonly logger?: (error: Error) => void;

	/**
	Filter errors which should not be logged or shown to the user. Return `true` to discard the error.

	Can be useful if you want to fail silently for classes of unhandled errors like `ERR_NETWORK_DISCONNECTED`. The `error` is guaranteed to have at least a `name` and `message` property.

	@default undefined

	@example
	```
	import unhandled from 'electron-unhandled';

	unhandled({
		filter: error => error.message.includes('ERR_NETWORK_DISCONNECTED')
	});
	```
	*/
	readonly filter?: (error: Error) => boolean;

	/**
	Present an error dialog to the user.

	@default [Only in production](https://github.com/sindresorhus/electron-is-dev)
	*/
	readonly showDialog?: boolean;

	/**
	Function that receives the default message of the error dialog and returns the message to show.

	Can be useful to add a prefix, or to translate the message.

	@default undefined

	@example
	```
	import unhandled from 'electron-unhandled';

	unhandled({
		message: message => `Please contact support: ${message}`
	});
	```
	*/
	readonly message?: (message: string) => string;

	/**
	Show the stack trace of the error in the error dialog and in the text that the `Copy Error` button copies. When disabled, the button copies the title and the type and message of the error only.

	A value that is not an error has no stack trace of your app, so the dialog shows the type and message of the error only.

	@default true
	*/
	readonly showStackTrace?: boolean;

	/**
	When specified, the error dialog will include a `Report…` button, which when clicked, executes the given function with the error as the first argument.

	@default undefined

	@example
	```
	import unhandled from 'electron-unhandled';
	import {openNewGitHubIssue} from 'electron-util';
	import {debugInfo} from 'electron-util/main';

	unhandled({
		reportButton: error => {
			openNewGitHubIssue({
				user: 'sindresorhus',
				repo: 'electron-unhandled',
				body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
			});
		}
	});

	// Example of how the GitHub issue will look like: https://github.com/sindresorhus/electron-unhandled/issues/new?body=%60%60%60%0AError%3A+Test%0A++++at+%2FUsers%2Fsindresorhus%2Fdev%2Foss%2Felectron-unhandled%2Fexample.js%3A27%3A21%0A%60%60%60%0A%0A---%0A%0AExample+1.1.0%0AElectron+3.0.8%0Adarwin+18.2.0%0ALocale%3A+en-US
	```
	*/
	readonly reportButton?: (error: Error) => void;
};

export type LogErrorOptions = {
	/**
	The text shown at the top of the error dialog. It is passed as the message of the dialog, because macOS does not show a dialog title.

	@default `${appName} encountered an error`
	*/
	readonly title?: string;

	/**
	Show the stack trace of the error in the error dialog and in the text that the `Copy Error` button copies. When disabled, the button copies the title and the type and message of the error only.

	@default true, until the `showStackTrace` option of `unhandled()` says otherwise
	*/
	readonly showStackTrace?: boolean;
};

/**
Catch unhandled errors and promise rejections in your [Electron](https://electronjs.org) app.

You probably want to call this both in the `main` process and any `renderer` processes to catch all possible errors.

__Note:__ At minimum, this function must be called in the `main` process.

A renderer process that crashes or stops responding is also reported. The reported error has no stack trace of your app, so the dialog and the copied text show the message without a stack trace. Pages created after this call are watched.

To catch the errors of a page, call this in a preload script with `contextIsolation: false`, or bundle it into the code of the page with `nodeIntegration`. An ES module preload script also needs `sandbox: false`. See the readme for the full setup.
*/
export default function unhandled(options?: UnhandledOptions): void;

/**
Log an error. This does the same as with caught unhandled errors.

It will use the same options specified in the `unhandled()` call or the defaults.

@param error - The error to log.

@example
```
import {logError} from 'electron-unhandled';

logError(new Error('🦄'));
```
*/
export function logError(error: Error, options?: LogErrorOptions): void;
