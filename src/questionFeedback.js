import anylogger from 'anylogger';
// import { default as anylogger } from "anylogger";
const log = anylogger('questionFeedback.js');

export function enableFeedbackOnQuestion() {
  console.groupCollapsed("Entering enableFeedbackOnQuestion for question: %s", this.questionId);

  // Usage: svlib.enableFeedbackOnQuestion.call(this);

  // --- Constants and Element Creation ---
  const closedIconEmpty = "🗨️"; // Icon for opening the feedback textarea
  const closedIconFilled = "💬"; 
  const openedIcon = "✔️"; // Icon for closing the feedback textarea
  const buttonRightOffset = 10; // Distance from the right edge for the button
  const buttonTopOffset = 10; // Distance from the top edge for the button
  const textareaButtonGap = 5; // Gap between the textarea and the button

  // Create the feedback button
  const feedbackButton = document.createElement("button");
  feedbackButton.textContent = closedIconEmpty; // Set initial icon
  log.debug("Created feedback button.");

  // Get the question ID and container
  const questionId = this.questionId;
  const questionContainer = this.getQuestionContainer();
  log.debug("Retrieved question container for question ID: %s", questionId);

  // Find the main div for the body of question text
  const questionDisplayWrapper = questionContainer.querySelector(".question-display-wrapper");
  if (!questionDisplayWrapper) {
      log.debug("Error: .question-display-wrapper not found in question container for question ID: %s", questionId);
      return; // Exit if the target element is not found
  }
  log.debug("Found .question-display-wrapper.");

  // Create the feedback textarea
  const feedbackTextarea = document.createElement("textarea");
  feedbackTextarea.placeholder = "Please enter any comments about this question here.";
  log.debug("Created feedback textarea.");

  // --- Initial Styling ---
  // Style for the feedback button
  feedbackButton.style.position = "absolute";
  // feedbackButton.style.right = `${buttonRightOffset}px`; // Position from the right
  // feedbackButton.style.top = `${buttonTopOffset}px`; // Position from the top
  feedbackButton.style.right = "10px";
  feedbackButton.style.top = "10px";
  feedbackButton.style.fontSize = "1.5em"; // Font size
  feedbackButton.style.zIndex = "1001"; // Ensure button is always above the textarea
  feedbackButton.style.backgroundColor = "transparent"; // Make button background transparent
  feedbackButton.style.border = "none"; // Remove button border
  feedbackButton.style.cursor = "pointer"; // Indicate clickable element
  feedbackButton.style.outline = "none"; // Remove outline on focus
  // Add tooltip
  feedbackButton.title = "Have feedback?";
  log.debug("Applied initial styles to feedback button.");

  // Style for the feedback textarea
  feedbackTextarea.style.position = "absolute";
  // feedbackTextarea.style.bottom = "10px"; // Position from the bottom of the wrapper
  feedbackTextarea.style.right = "50px";
  feedbackTextarea.style.top = "10px"; // Align top edges with the button
  feedbackTextarea.style.width = "calc(100% - 60px)"; // Adjust width to make space for the button (approx)
  feedbackTextarea.style.maxWidth = "300px"; // Max width for the textarea
  feedbackTextarea.style.height = "100px"; // Initial height
  feedbackTextarea.style.maxHeight = "200px"; // Max height
  feedbackTextarea.style.zIndex = "1000"; // Ensure textarea is below the button
  feedbackTextarea.style.display = "none"; // Initially hidden
  feedbackTextarea.style.backgroundColor = "#f9f9f9"; // Slightly lighter background
  feedbackTextarea.style.border = "1px solid #ddd"; // Lighter border
  feedbackTextarea.style.borderRadius = "5px"; // Rounded corners
  feedbackTextarea.style.padding = "10px"; // Increased padding
  feedbackTextarea.style.fontSize = "1em"; // Font size
  feedbackTextarea.style.resize = "vertical"; // Allow vertical resizing only
  feedbackTextarea.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)"; // More pronounced shadow
  feedbackTextarea.style.transition = "all 0.3s ease-in-out"; // Smooth transition with ease-in-out
  feedbackTextarea.style.fontFamily = "Arial, sans-serif"; // Font family
  feedbackTextarea.style.color = "#333"; // Dark text color
  feedbackTextarea.style.lineHeight = "1.6"; // Improved line height
  feedbackTextarea.style.boxSizing = "border-box"; // Include padding and border
  feedbackTextarea.style.overflowY = "auto"; // Enable vertical scrolling if needed
  feedbackTextarea.style.wordWrap = "break-word"; // Break long words
  log.debug("Applied initial styles to feedback textarea.");

  // --- Append Elements ---
  // It's good practice to ensure the container has a position property
  // for absolute positioning of its children to work relative to it.
  if (getComputedStyle(questionDisplayWrapper).position === 'static') {
      questionDisplayWrapper.style.position = 'relative';
      log.debug("Set questionDisplayWrapper position to 'relative'.");
  }

  // Append the button and textarea to the questionDisplayWrapper
  questionDisplayWrapper.appendChild(feedbackButton);
  questionDisplayWrapper.appendChild(feedbackTextarea);
  log.debug("Appended feedback button and textarea to questionDisplayWrapper.");

  // --- Event Listener ---
  feedbackButton.addEventListener("click", function() {
      log.debug("Feedback button clicked for question: %s", questionId);

      // Toggle the visibility of the textarea
      if (feedbackTextarea.style.display === "none") {
          log.debug("Showing feedback textarea.");
          feedbackTextarea.style.display = "block";
          feedbackButton.textContent = openedIcon; // Change icon to opened
          feedbackButton.style.transform = "scaleX(1)"; // Reset mirror

          // Position the textarea to the left of the button
          // We calculate the right position based on the button's right position and its width
          feedbackTextarea.style.right = `${buttonRightOffset + feedbackButton.offsetWidth + textareaButtonGap}px`;
          feedbackTextarea.style.top = `${buttonTopOffset}px`; // Align top edges

          // Give focus to textarea
          feedbackTextarea.focus();

      } else {
          log.debug("Hiding feedback textarea.");
          feedbackTextarea.style.display = "none";
          // Reset button position (not strictly necessary here as button position doesn't change when hidden?)
          feedbackButton.style.top = `${buttonTopOffset}px`;
          feedbackButton.style.right = `${buttonRightOffset}px`;  
      }
  });

  feedbackTextarea.addEventListener("blur", function() {
      log.debug("Textarea lost focus.");
      const feedback = feedbackTextarea.value.trim();
      if (feedback) {
          try {
              sessionStorage.setItem(questionId + "_feedback", feedback);
              log.debug("Feedback saved to sessionStorage for question: %s", questionId);
          } catch (e) {
              log.debug("Error saving feedback to sessionStorage: %o", e);
          }
          feedbackButton.textContent = closedIconFilled;
          feedbackButton.style.transform = "scaleX(-1)"; // Horiz mirror to match closedIconEmpty
      } else {
          log.debug("No feedback entered for question: %s", questionId);
          feedbackButton.textContent = closedIconEmpty; // Reset icon if no feedback
      }

      if (event.relatedTarget === feedbackButton) {
          return
      } else {
          log.debug("Textarea blurred and focus moved elsewhere. Hiding textarea.");
          feedbackTextarea.style.display = "none"; // Hide it
      }
  });

  document.addEventListener("DOMContentLoaded", function() {
      const savedFeedback = sessionStorage.getItem(questionId + "_feedback");
      if (savedFeedback) {
          feedbackTextarea.value = savedFeedback;
          feedbackButton.textContent = closedIconFilled; // Change icon to indicate saved feedback
          log.debug("Loaded saved feedback from sessionStorage for question: %s", questionId);
      } else {
          log.debug("No saved feedback found in sessionStorage for question: %s", questionId);
          feedbackButton.textContent = closedIconEmpty; // Reset icon if no saved feedback
      }
  });

  log.debug("Feedback button event listener added for question: %s. Exiting enableFeedbackOnQuestion().", questionId);
  console.groupEnd();
};



export function storeQuestionFeedbackAsEmbeddedData() {
  // Usage: svlib.storeQuestionFeedbackAsEmbeddedData();
  console.groupCollapsed("Serializing and storing feedback for all questions.");

  // Find all QID + "_feedback" items in sessionStorage
  const feedbackKeys = Object.keys(sessionStorage).filter(key => key.endsWith("_feedback"));
  log.debug("Found %d feedback keys in sessionStorage.", feedbackKeys.length);
  if (feedbackKeys.length > 0) {
      const feedbackData = {};
      feedbackKeys.forEach(key => {
          const questionId = key.split("_")[0]; // Extract QID from the key
          const feedback = sessionStorage.getItem(key);
          feedbackData[questionId] = feedback;
          log.debug("Storing feedback for %s: %s", questionId, feedback);
      });

      // Store the feedback data as embedded data
      Qualtrics.SurveyEngine.setJSEmbeddedData("feedbackData", JSON.stringify(feedbackData));
      log.success("Stored feedback data as embedded data.");
  } else {
      log.warn("No feedback keys found in sessionStorage.");
  }
  console.groupEnd();
};