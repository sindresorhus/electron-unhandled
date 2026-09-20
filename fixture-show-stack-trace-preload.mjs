import {logError} from './index.js';

logError(new Error('From a renderer'), {title: 'From a renderer', showStackTrace: false});
