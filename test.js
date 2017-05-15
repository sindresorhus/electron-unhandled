import electron from 'electron';
import test from 'ava';
import execa from 'execa';

// TODO: Improve these tests when https://github.com/avajs/ava/issues/1332 is fixed

const run = file => execa.stdout(electron, [file], {
	cwd: __dirname,
	env: {
		ELECTRON_ENABLE_LOGGING: true,
		ELECTRON_ENABLE_STACK_DUMPING: true,
		ELECTRON_NO_ATTACH_CONSOLE: true
	}
});

test('error', async t => {
	await t.notThrows(run('fixture-error.js'));
});

test('rejection', async t => {
	await t.notThrows(run('fixture-rejection.js'));
});
