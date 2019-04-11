import {expectType} from 'tsd';
import unhandled = require('.');

unhandled({logger: error => expectType<Error>(error)});
unhandled({logger: console.log});
unhandled({showDialog: true});
unhandled({reportButton: error => expectType<Error>(error)});

unhandled.logError(new Error());
unhandled.logError(new Error(), {title: 'foo'});
