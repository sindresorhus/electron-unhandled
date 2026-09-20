import process from 'node:process';

setTimeout(() => {
	process.crash();
}, 200);
