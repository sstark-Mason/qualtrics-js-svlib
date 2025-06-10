// src/main.ts
import { describeThisQuestion } from "./qualtricsUtils";
import { testDataPersistence } from "./storageUtils";
import { enableFeedbackOnQuestion, storeAllSessionFeedbackAsEmbeddedData } from "./feedbackUtils";
import { enableComprehensionQuestion } from "./comprehensionQuestionUtils";
import { enableQuestionChoiceLogger } from "./questionEventUtils";
import { NextButtonManager } from "./nextButtonManager";

// This is the main entry point for your library.
// Functions exported from here will be accessible on the global object
// when bundled with esbuild's iife format and globalName.

let nextButtonManager: NextButtonManager | null = null;
(window as any).nextButtonManager = new NextButtonManager();

console.log("svlib loading...");
/**
 * Records data. In a real scenario, this might interact with Qualtrics'
 * embedded data fields or use Qualtrics JS API.
 * @param data The data to record.
 */
function recordData(data: Record<string, any>): void {
  console.debug("Recording data:", data);
  // Example: Set Qualtrics embedded data
  // if (window.Qualtrics && Qualtrics.SurveyEngine) {
  //   Qualtrics.SurveyEngine.setEmbeddedData("customData", JSON.stringify(data));
  // }
}

// To make these functions easily callable from Qualtrics after including the
// bundled script, we export them. When esbuild bundles this as an IIFE
// with a `globalName`, these exports will be attached to that global object.
export { 
  recordData, 
  describeThisQuestion, 
  testDataPersistence, 
  enableFeedbackOnQuestion, 
  storeAllSessionFeedbackAsEmbeddedData, 
  enableComprehensionQuestion, 
  enableQuestionChoiceLogger, 
 };

console.info("svlib loaded and ready.");
