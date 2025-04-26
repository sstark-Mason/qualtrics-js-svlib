// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser'; // Use default export
import commonjs from '@rollup/plugin-commonjs'; // Use default export
// import anylogger from 'anylogger';

export default {
//   input: 'src/main.js', // Your main entry point file
    input: 'src/main.js',
    output: {
        file: 'dist/svlib.min.js', // Output file path
        format: 'iife', // Immediately Invoked Function Expression - good for browser scripts
        name: 'svlib', // The global variable name your IIFE will expose (window.svlib)
        sourcemap: true, // Set to true for easier debugging during development if needed
        exports: 'named'
    },
    plugins: [
        resolve(), // Finds node_modules
        terser(), // Minify the output
        commonjs() // Converts CommonJS modules to ES6, so Rollup can include them in the bundle
        // anylogger(), // Custom plugin to handle logging
    ]
};
