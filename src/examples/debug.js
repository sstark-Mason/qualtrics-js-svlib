// Detect DEBUG_MODE once, export a boolean.
import log from './logger.js'

export function detectDebugMode() {
  let debug = false
  try {
    const params = new URLSearchParams(window.location.search)
    if (['true','preview'].includes(params.get('debug')?.toLowerCase())
      || window.self !== window.top) {
      debug = true
      log.log('Debug mode enabled')
    }
  } catch (e) {
    log.error('Error during debug detection', e)
  }
  return debug
}

export const DEBUG_MODE = detectDebugMode()
