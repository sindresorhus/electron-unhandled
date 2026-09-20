import unhandled from './index.js';

unhandled();

setTimeout(() => {
	throw new Error('Renderer error');
}, 50);
