// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser'; // Use default export
import anylogger from 'anylogger';

export default {
  input: 'src/main.js', // Your main entry point file
  output: {
    file: 'dist/svlib.min.js', // Output file path
    format: 'iife', // Immediately Invoked Function Expression - good for browser scripts
    name: 'svlib', // The global variable name your IIFE will expose (window.svlib)
    sourcemap: true // Set to true for easier debugging during development if needed
  },
  plugins: [
    resolve(), // Finds node_modules
    terser(), // Minify the output
    anylogger(), // Custom plugin to handle logging
  ]
};
