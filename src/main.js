import { enableFeedbackOnQuestion, storeQuestionFeedbackAsEmbeddedData } from "./questionFeedback.js";
import anylogger from 'anylogger';
const log = anylogger('main.js');

export function addOnload() {

  Qualtrics.SurveyEngine.addOnload(function() {
    const log = anylogger.getLogger('addOnload');
    log.log('SurveyEngine.onload');


    // Optionally, store feedback as embedded data when the survey is submitted
    Qualtrics.SurveyEngine.addOnPageSubmit(function() {
      storeQuestionFeedbackAsEmbeddedData();
    });
  });
}


const svlib = {
  addOnload,
  enableFeedbackOnQuestion,
  storeQuestionFeedbackAsEmbeddedData
};

if (typeof window !== 'undefined') {
  window.svlib = svlib;
}

export default svlib;