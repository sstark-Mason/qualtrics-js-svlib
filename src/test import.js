// simple-library.js
// Wrap the entire library in an IIFE (Immediately Invoked Function Expression)
// This creates a private scope and avoids polluting the global namespace.
;(function(window, svlib, undefined) {
    'use strict'; // Enforce stricter parsing and error handling
  
    // Use svlib for logging if available, otherwise fallback to console.log
    const log = svlib ? svlib.log : console.log;
  
    // --- Library Definition ---
    // This object will hold our public functions/properties
    const MySimpleLibrary = {
      /**
       * A simple test function that logs a message to the console.
       */
      testFunction: function() {
        const message =
          'Hello from MySimpleLibrary.testFunction! The library was loaded and called successfully.';
        log(message);
  
        // You could add more complex logic here if needed for testing
      }
  
      // You could add more functions or properties here later
      // version: '0.1.0'
    };
  
    // --- Expose the Library ---
    // Attach the public API to the global window object,
    // making it accessible outside the IIFE.
    window.MySimpleLibrary = MySimpleLibrary;
  
    log('MySimpleLibrary (external file) has been defined.');
  
    // Pass window and potentially svlib (if it exists globally) into the IIFE
  })(window, window.svlib);
  