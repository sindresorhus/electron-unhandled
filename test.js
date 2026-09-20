import electron from 'electron';
import test from 'ava';
import {execa} from 'execa';

// The fixtures run in their own Electron process, because ava cannot run its test files in the same process (https://github.com/avajs/ava/issues/1332)

const run = async file => execa(electron, [file], {
	cwd: import.meta.dirname,
	// The fixtures quit the app when the error arrives. A timeout makes a fixture that never gets the error fail instead of hanging.
	timeout: 30_000,
	env: {
		ELECTRON_ENABLE_LOGGING: true,
		ELECTRON_ENABLE_STACK_DUMPING: true,
		ELECTRON_NO_ATTACH_CONSOLE: true,
	},
});

test('error', async t => {
	await t.notThrowsAsync(run('fixture-error.js'));
});

test('rejection', async t => {
	await t.notThrowsAsync(run('fixture-rejection.js'));
});

test('renderer', async t => {
	await t.notThrowsAsync(run('fixture-renderer.js'));
});

test('renderer error event without an error object', async t => {
	await t.notThrowsAsync(run('fixture-renderer-error-event.js'));
});
