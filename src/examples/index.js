// Prettier width=80
import './debug.js'           // sets DEBUG_MODE
import { wireQualtrics } from './surveyEngine.js'

// Kick off the Qualtrics hooks
wireQualtrics()

// Re-export modules for direct use if needed:
export * from './logger.js'
export * from './utils.js'
export * from './storage.js'
