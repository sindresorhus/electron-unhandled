import {contextBridge} from 'electron';
import {logError} from './index.js';

contextBridge.exposeInMainWorld('logError', logError);

setTimeout(() => {
	logError(Symbol('Tests handling of non-serializable values'));
}, 2000); // We use setTimeout so the error won't occur before devtools can open
