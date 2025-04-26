// Example utility function
export function logMessage(message) {
    // Prefer svlib if available, fallback to console.log
    const log = window.svlib ? window.svlib.log : console.log;
    log(`[MyLib] ${message}`);
  }
  