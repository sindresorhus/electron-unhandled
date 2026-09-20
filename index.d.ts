/**
__Note:__ Options can only be specified in the `main` process.
*/
export type UnhandledOptions = {
	/**
	Custom logger that receives the error.

	Can be useful if you for example integrate with Sentry.

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

	Default: [Only in production](https://github.com/sindresorhus/electron-is-dev).
	*/
	readonly showDialog?: boolean;

	/**
	When specified, the error dialog will include a `Report…` button, which when clicked, executes the given function with the error as the first argument.

	@default undefined

	@example
	```
	import unhandled from 'electron-unhandled';
	import {openNewGitHubIssue, debugInfo} from 'electron-util';

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
	The title of the error dialog.

	@default `${appName} encountered an error`
	*/
	readonly title?: string;
};

/**
Catch unhandled errors and promise rejections in your [Electron](https://electronjs.org) app.

You probably want to call this both in the `main` process and any `renderer` processes to catch all possible errors.

__Note:__ At minimum, this function must be called in the `main` process.
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
