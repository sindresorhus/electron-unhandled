import unhandled from './index.js';

unhandled();

// An error event without an error object, like a script error from another origin
globalThis.dispatchEvent(new ErrorEvent('error', {message: 'Boom from another origin'}));
