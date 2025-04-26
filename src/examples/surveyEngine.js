// Prettier width=80
import { initTabs } from './tabs.js'
import log from './logger.js'

export function wireQualtrics() {
  Qualtrics.SurveyEngine.addOnload(function() {
    log.log('SurveyEngine.onload')
    initTabs()
    // other init calls:
    // feedback.enableFeedbackOnQuestion.call(this)
    // comprehension.comprehensionQuestionSetupMC.call(this, opts)
    // etc.
  })

  Qualtrics.SurveyEngine.addOnPageSubmit(function() {
    // e.g. storeFeedbackAsEmbeddedData()
    log.log('SurveyEngine.onPageSubmit')
  })
}
