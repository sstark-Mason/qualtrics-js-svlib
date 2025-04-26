// Prettier width=80
import log from './logger.js'

/**
 * Initialize the multi-version tab system on the page
 */
export function initTabs() {
  log.log('initTabs: start')
  const mvContainers = document.querySelectorAll('.mv-container')
  if (!mvContainers.length) {
    log.log('initTabs: no .mv-container found')
    return
  }
  mvContainers.forEach((mvContainer, ci) => {
    log.log('initTabs: container #%d → %o', ci+1, mvContainer)
    const versions = mvContainer.querySelectorAll(':scope>.mv-version')
    if (!versions.length) {
      log.warn('container #%d has no .mv-version, skipping', ci+1)
      return
    }
    const tabBar = document.createElement('div')
    tabBar.className = 'mv-tab-bar'
    const ul = document.createElement('ul')
    ul.className = 'mv-tabs'
    versions.forEach((ver, vi) => {
      const name = ver.dataset.name||`Version ${vi+1}`
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.textContent = name
      a.href = '#'
      a.dataset.vi = vi
      a.addEventListener('click', e => {
        e.preventDefault()
        const idx = +a.dataset.vi
        log.log('tab clicked: %s (idx=%d)', name, idx)
        // deactivate
        ul.querySelectorAll('a').forEach(x => x.classList.remove('active'))
        versions.forEach(x => x.classList.remove('active'))
        // activate
        a.classList.add('active')
        versions[idx]?.classList.add('active')
      })
      li.append(a)
      ul.append(li)
    })
    // insert before container
    mvContainer.parentNode.insertBefore(tabBar, mvContainer)
    tabBar.append(ul)
    // initial
    ul.querySelector('a')?.classList.add('active')
    versions[0].classList.add('active')
  })
  log.log('initTabs: done')
}
