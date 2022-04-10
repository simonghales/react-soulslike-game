/* eslint-disable */

// because of some weird react/dev/webpack/something quirk
// @ts-ignore
self.$RefreshReg$ = () => {};
// @ts-ignore
self.$RefreshSig$ = () => () => {};

// @ts-ignore
if (typeof __webpack_require__ !== undefined) {
    // @ts-ignore
    __webpack_require__.$Refresh$ = {
        register: () => {},
        signature: () => () => {},
        cleanup: () => {},
        setup: () => {},
    };
}

const createWorkerApp = require('react-three-physics').createWorkerApp

console.log('worker...')

// @ts-ignore
const WorkerApp = require('./WorkerApp').WorkerApp

createWorkerApp(WorkerApp)
