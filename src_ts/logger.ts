// // src/logger.ts
// import "ulog";
// import anylogger from "anylogger";

// // Configure a basic console adapter if no other logging framework is present
// // if (!anylogger.ext) {
// //   const consoleAdapter = {
// //     error: console.error.bind(console),
// //     warn: console.warn.bind(console),
// //     info: console.info.bind(console),
// //     log: console.log.bind(console),
// //     debug: console.debug?.bind(console) || console.log.bind(console),
// //     trace: console.trace?.bind(console) || console.log.bind(console),
// //   };
// //   anylogger.ext = (logger) => Object.assign(logger, consoleAdapter);
// // }

// // Create a logger instance for your library
// const log = anylogger("svlib:logger");

// export default log;