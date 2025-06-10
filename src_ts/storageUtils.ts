declare const Qualtrics: any;

export function testDataPersistence(qContext: any): void {
  console.groupCollapsed("testDataPersistence");
  const questionId = qContext.questionId;

  // Testing embedded data persistence
  // Warning: Qualtrics.SurveyEngine.getEmbeddedData() is deprecated and will return null in the "simple layout".
  console.group("calling testEmbed"); // Survey Flow: Set "testEmbed" to "default value of testEmbed"
      console.info("testEmbed: %s", Qualtrics.SurveyEngine.getJSEmbeddedData("testEmbed")); // Prints: "default value of __js_testEmbed"
      console.info("Setting to 'NEW VALUE of testEmbed'...");
      Qualtrics.SurveyEngine.setJSEmbeddedData("testEmbed", "NEW VALUE of testEmbed"); // Doesn't persist through refresh, but successfully sets "__js_testEmbed" to "NEW VALUE of testEmbed" upon page submission.
      console.info("Retrieving testEmbed again (check against final response form): %s", Qualtrics.SurveyEngine.getJSEmbeddedData("testEmbed")); // Prints: "NEW VALUE of testEmbed"
  console.groupEnd();

  console.group("calling __js_testEmbed"); // Survey Flow: Set "__js_testEmbed" to "default value of __js_testEmbed"
      console.info("__js_testEmbed: %s", Qualtrics.SurveyEngine.getJSEmbeddedData("__js_testEmbed")); // Prints: "default value of __js___js_testEmbed"
      console.info("Setting to 'NEW VALUE of __js_testEmbed'...");
      Qualtrics.SurveyEngine.setJSEmbeddedData("__js_testEmbed", "NEW VALUE of __js_testEmbed"); // Doesn't persist through refresh, but successfully sets "__js___js_testEmbed" to "NEW VALUE of __js_testEmbed" upon page submission.
      console.info("Retrieving __js_testEmbed again (check against final response form): %s", Qualtrics.SurveyEngine.getJSEmbeddedData("__js_testEmbed")); // Prints: "NEW VALUE of __js_testEmbed"
  console.groupEnd();

  console.group("calling __js___js_testEmbed"); // Survey Flow: Set "__js___js_testEmbed" to "default value of __js___js_testEmbed"
      console.info("__js___js_testEmbed: %s", Qualtrics.SurveyEngine.getJSEmbeddedData("__js___js_testEmbed")); // Prints: undefined
      console.info("Setting to 'NEW VALUE of __js___js_testEmbed'...");
      Qualtrics.SurveyEngine.setJSEmbeddedData("__js___js_testEmbed", "NEW VALUE of __js___js_testEmbed"); // Doesn't persist through refresh and does not set any embedded data in the final response form (since it's looking for a non-existent "__js___js___js_testEmbed" in the survey flow), but DOES persist on page submit and can be loaded on the next page (returning "NEW VALUE of __js___js_testEmbed" instead of undefined).
      console.info("Retrieving __js___js_testEmbed again (check against final response form): %s", Qualtrics.SurveyEngine.getJSEmbeddedData("__js___js_testEmbed")); // Prints: "NEW VALUE of __js___js_testEmbed"
  console.groupEnd();

  // Testing sessionStorage persistence
  let sessionData = sessionStorage.getItem("testData") ?? null;
  if (sessionData) {
      console.info("Session data loaded:", sessionData);
  } else {
      console.warn("No session data found. Embedding...");
      sessionData = "session test string";
      sessionStorage.setItem("testData", sessionData);
  }

  // Testing localStorage persistence
  let localData = localStorage.getItem("testData") ?? null;
  if (localData) {
      console.info("Local data loaded:", localData);
  } else {
      console.warn("No local data found. Embedding...");
      localData = "local test string";
      localStorage.setItem("testData", localData);
  }
  console.groupEnd();
}

export function saveSessionJson(key: string, data: Record<string, any>): void {
  try {
    const jsonString = JSON.stringify(data);
    sessionStorage.setItem(key, jsonString);
  } catch (error) {
    console.error("Error saving session data: %s", error);
  }
}

export function loadSessionJson(key: string): Record<string, any> | null {
  try {
    const jsonString = sessionStorage.getItem(key);
    return jsonString ? JSON.parse(jsonString) : null;
  } catch (error) {
    console.error("Error loading session data: %s", error);
    return null;
  }
}

export function transferSessionDataToEmbeddedData(
  sessionKey: string,
  embeddedDataKey: string
): void {

  try {
    const sessionData = sessionStorage.getItem(sessionKey);
    if (sessionData) {    
      // Set the embedded data in Qualtrics
      Qualtrics.SurveyEngine.setJSEmbeddedData(embeddedDataKey, sessionData);
    }
  } catch (error) {
      console.error("Error transferring session data to embedded data: %s", error);
    }
}