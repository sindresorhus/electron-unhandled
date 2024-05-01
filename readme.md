# electron-unhandled

> Catch unhandled errors and promise rejections in your [Electron](https://electronjs.org) app

You can use this module directly in both the main and renderer process.

## Install

```sh
npm install electron-unhandled
```

*Requires Electron 30 or later.*

## Usage

```js
import unhandled from 'electron-unhandled';

unhandled();
```

## API

### unhandled(options?)

You probably want to call this both in the `main` process and any `renderer` processes to catch all possible errors. 

**Note:** At minimum, this function must be called in the `main` process.

### options

Type: `object`

Note: Options can only be specified in the `main` process.

#### logger

Type: `Function`\
Default: `console.error`

Custom logger that receives the error.

Can be useful if you for example integrate with Sentry.

#### showDialog

Type: `boolean`\
Default: [Only in production](https://github.com/sindresorhus/electron-is-dev)

Present an error dialog to the user.

<img src="screenshot.png" width="532">

#### reportButton

Type: `Function`\
Default: `undefined`

When specified, the error dialog will include a `Report…` button, which when clicked, executes the given function with the error as the first argument.

```js
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
```

[Example of how the GitHub issue will look like.](https://github.com/sindresorhus/electron-unhandled/issues/new?body=%60%60%60%0AError%3A+Test%0A++++at+%2FUsers%2Fsindresorhus%2Fdev%2Foss%2Felectron-unhandled%2Fexample.js%3A27%3A21%0A%60%60%60%0A%0A---%0A%0AExample+1.1.0%0AElectron+3.0.8%0Adarwin+18.2.0%0ALocale%3A+en-US)

### logError(error, [options])

Log an error. This does the same as with caught unhandled errors.

It will use the same options specified in the `unhandled()` call or the defaults.

```js
import {logError} from 'electron-unhandled';

logError(new Error('🦄'));
```

#### error

Type: `Error`

The error to log.

#### options

Type: `object`

##### title

Type: `string`\
Default: `${appName} encountered an error`

The title of the error dialog.

## Related

- [electron-store](https://github.com/sindresorhus/electron-store) - Save and load data like user settings, app state, cache, etc
- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-context-menu](https://github.com/sindresorhus/electron-context-menu) - Context menu for your Electron app
- [electron-dl](https://github.com/sindresorhus/electron-dl) - Simplified file downloads for your Electron app
