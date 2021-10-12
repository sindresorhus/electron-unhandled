const { logError } = require('./')

window.logError = logError

setTimeout(() => { logError(Symbol()) }, 2000); // setTimeout so error won't occur before devtools can open