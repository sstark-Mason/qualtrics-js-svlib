// Prettier width=80
/**
 * Fisher–Yates shuffle
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Collect non-empty text nodes under root
 */
export function collectTextNodes(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  )
  const nodes = []
  let node
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim() !== '') nodes.push(node)
  }
  return nodes
}

/**
 * Inject a random diacritic into str
 */
export function injectDiacritic(str, diacritics) {
  if (!str) return str
  const chars = Array.from(str)
  const pos = Math.floor(Math.random() * chars.length)
  const mark = diacritics[Math.floor(Math.random() * diacritics.length)]
  chars[pos] = chars[pos] + mark
  return chars.join('')
}
