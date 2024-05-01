import {logError} from './index.js';

window.logError = logError;

setTimeout(() => {
	logError(Symbol('Tests handling of non-serializable values'));
}, 2000); // We use setTimeout so the error won't occur before devtools can open
