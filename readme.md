# electron-unhandled

> Catch unhandled errors and promise rejections in your [Electron](https://electronjs.org) app

You can use this module in both the main process and renderer processes. See [Renderer processes](#renderer-processes) for the setup that a renderer needs.

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

### Renderer processes

The module must run where it can see the errors, and it must be able to reach the main process. That has two consequences:

- The module has to be bundled into your renderer code, or loaded from a [preload script](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload). A `<script type="module">` in a page cannot resolve the imports of the module, such as `electron` and `node:process`.
- The context must see the errors of the page. A preload script with `contextIsolation` enabled (the Electron default) does not receive errors from the page, so `unhandled()` in such a preload reports only the errors of the preload itself. Set `contextIsolation: false` to catch the errors of the page, or catch them in the page and send them to the main process yourself.

The handlers are registered by the `unhandled()` call. They are not injected into windows that are created later, because a page cannot load the module without `nodeIntegration`. Call `unhandled()` in the code of each window instead.

An ES module preload script needs `sandbox: false`, because [a sandboxed preload script cannot use ESM imports](https://www.electronjs.org/docs/latest/tutorial/esm#sandboxed-preload-scripts-cant-use-esm-imports).

## API

### unhandled(options?)

You probably want to call this both in the `main` process and any `renderer` processes to catch all possible errors.

**Note:** At minimum, this function must be called in the `main` process.

A renderer process that crashes or stops responding is also reported. The reported error has no stack trace of your app, so the dialog shows the message only. Pages that are created after the call are watched.

### options

Type: `object`

Note: These options can only be specified in the `main` process.

#### logger

Type: `Function`\
Default: `console.error`

Custom logger that receives the error.

Can be useful if you for example integrate with Sentry.

Use it to run your own code for an error, for example to restart the app:

```js
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

#### filter

Type: `(error: Error) => boolean`\
Default: `undefined`

Filter errors which should not be logged or shown to the user. Return `true` to discard the error.

Can be useful if you want to fail silently for classes of unhandled errors like `ERR_NETWORK_DISCONNECTED`. The `error` is guaranteed to have at least a `name` and `message` property.

```js
import unhandled from 'electron-unhandled';

unhandled({
	filter: error => error.message.includes('ERR_NETWORK_DISCONNECTED')
});
```

#### showDialog

Type: `boolean`\
Default: [Only in production](https://github.com/sindresorhus/electron-is-dev)

Present an error dialog to the user.

<img src="screenshot.png" width="532">

#### message

Type: `(message: string) => string`\
Default: `undefined`

Function that receives the default message of the error dialog and returns the message to show.

Can be useful to add a prefix, or to translate the message.

```js
import unhandled from 'electron-unhandled';

unhandled({
	message: message => `Please contact support: ${message}`
});
```

#### showStackTrace

Type: `boolean`\
Default: `true`

Show the stack trace of the error in the error dialog and in the text that the `Copy Error` button copies. When disabled, the button copies the title and the type and message of the error only.

#### reportButton

Type: `Function`\
Default: `undefined`

When specified, the error dialog will include a `Report…` button, which when clicked, executes the given function with the error as the first argument.

```js
import unhandled from 'electron-unhandled';
import {openNewGitHubIssue} from 'electron-util';
import {debugInfo} from 'electron-util/main';

unhandled({
	reportButton: error => {
		openNewGitHubIssue({
			user: 'sindresorhus',
			repo: 'electron-unhandled',
			body: `
## Node.js error stack

\`\`\`
${error.stack}
\`\`\`

## Node.js debug info

${debugInfo()}`
		});
	}
});
```

[Example of how the GitHub issue will look like.](https://github.com/sindresorhus/electron-unhandled/issues/new?body=%60%60%60%0AError%3A+Test%0A++++at+%2FUsers%2Fsindresorhus%2Fdev%2Foss%2Felectron-unhandled%2Fexample.js%3A27%3A21%0A%60%60%60%0A%0A---%0A%0AExample+1.1.0%0AElectron+3.0.8%0Adarwin+18.2.0%0ALocale%3A+en-US)

### logError(error, options?)

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

The text shown at the top of the error dialog. It is passed as the message of the dialog, because macOS does not show a dialog title.

In a renderer process the default is `App encountered an error`, because the app name is not available there.

##### showStackTrace

Type: `boolean`\
Default: `true`, until the [`showStackTrace`](#showstacktrace) option of `unhandled()` says otherwise

Show the stack trace of the error in the error dialog and in the text that the `Copy Error` button copies. When disabled, the button copies the title and the type and message of the error only.

## Related

- [electron-store](https://github.com/sindresorhus/electron-store) - Save and load data like user settings, app state, cache, etc
- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-context-menu](https://github.com/sindresorhus/electron-context-menu) - Context menu for your Electron app
- [electron-dl](https://github.com/sindresorhus/electron-dl) - Simplified file downloads for your Electron app
