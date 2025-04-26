import { logMessage } from './utils.js';

// This file defines the public API of the library

// Private stuff can remain within this module scope
let initCalled = false;

function privateHelper() {
  logMessage('Private helper called.');
}

// Public API methods
function init(options = {}) {
  logMessage(`Initializing with options: ${JSON.stringify(options)}`);
  privateHelper();
  initCalled = true;
  // ... actual initialization logic ...
}

function testFunction() {
  if (!initCalled) {
    logMessage('Warning: testFunction called before init!');
  }
  logMessage('testFunction executed successfully!');
}

// Export the public API explicitly
// Note: Rollup's 'iife' format with a 'name' will automatically
// assign the *default* export or an object of named exports
// to window[name]. Let's export an object.
export { init, testFunction };

// Log when the main module itself is evaluated
logMessage('main.js module evaluated.');
