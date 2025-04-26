import { default as anylogger } from "anylogger";
const log = anylogger('sessionStorageUtils.js');

export function saveSessionJson(key, jsonObj) {
  // Usage: svlib.saveSessionJson.call(this, key, jsonObj);
  console.groupCollapsed("saveSessionJson(%s, %o)", key, jsonObj);
  try
  {
      const jsonString = JSON.stringify(jsonObj);
      sessionStorage.setItem(key, jsonString);
  }
  catch (e)
  {
      log.error("Error saving session JSON:", e);
  }
  console.groupEnd();
};

export function loadSessionJson(key) {
  // Usage: let obj = svlib.loadSessionJson.call(this, key);
  console.groupCollapsed("loadSessionJson(%s)", key);

  let jsonString = sessionStorage.getItem(key) ?? null;
  let jsonObj = null;

  if (jsonString && jsonString.trim() !== "") {
      log.debug("Parsing JSON string for %s.", key);
      try
      {
          jsonObj = JSON.parse(jsonString);
          log.debug("Parsed JSON object: %o", jsonObj);
      }
      catch (e)
      {
          log.error("Error parsing session JSON:", e);
      }
  } else {
      log.log("No valid JSON string found for %s. Returning empty obj {}.", key);
  }
  console.groupEnd();
  return jsonObj;
};