// Prettier width=80
import anylogger from 'anylogger'

// Create a named logger for our library
const log = anylogger('svlib')

// Re-export the anylogger methods you use
export const { log: info, warn, error, success } = log
export default log
