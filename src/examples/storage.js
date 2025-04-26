// Prettier width=80
import log from './logger.js'

/**
 * Save an object as JSON in sessionStorage
 */
export function saveSessionJson(key, obj) {
  log.log('saveSessionJson(): key=%s, obj=%o', key, obj)
  try {
    sessionStorage.setItem(key, JSON.stringify(obj))
  } catch (e) {
    log.error('Error saving to sessionStorage:', e)
  }
}

/**
 * Load and parse JSON from sessionStorage
 */
export function loadSessionJson(key) {
  log.log('loadSessionJson(): key=%s', key)
  try {
    const s = sessionStorage.getItem(key)
    if (s) return JSON.parse(s)
  } catch (e) {
    log.error('Error loading/parsing sessionStorage:', e)
  }
  return null
}
