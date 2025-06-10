# qualtrics-js-svlib

This library provides functionality for surveys and experiments on Qualtrics.

## Importing this library

1. In the Qualtrics Survey Builder, go to the `Look and feel` tab (paintbrush on the left).
2. Find `Look and feel > General > Header`.
3. Paste the following into the `Header`:

```html
    <script src="https://sstark-mason.github.io/qualtrics-js-svlib/dist/svlib.min.js"></script><link rel="stylesheet" type="text/css" href="https://sstark-mason.github.io/qualtrics-js-svlib/dist/svlib.css">
```

Your survey will now import the library on page load.

## Using this library

Library functions are namespaced under `svlib`. Most functions are intended to be called from the JavaScript of individual questions. For example:

1. In the Qualtrics Survey Builder, go to the main tab (`Edit question`).
2. Select the question you want to add a function to.
3. On the left, select `Question behavior > JavaScript`.
4. Add the function call under `addOnload` or `addOnReady`. For example:

```javascript
    Qualtrics.SurveyEngine.addOnReady(function()
    {
        svlib.enableFeedbackOnQuestion(this);
        svlib.enableComprehensionQuestion(this, correctChoices = [1]);

    });
```

This enables feedback on `this` question and turns `this` question into a comprehension question where correct choices are `1` (the first choice option in the survey builder).

## Methods

### Question Feedback

Question-level function: `svlib.enableFeedbackOnQuestion(this);`
Example call: `svlib.enableFeedbackOnQuestion(this);`

To store feedback, go to `Survey flow`. Click on `Add a New Element Here`. Select `Embedded Data`.

- Name the embedded data field `__js_questionFeedbackJSON`.
- You do not need to set a value.
- Make sure this block is at the start of the survey (before any questions are encountered).
- Without this embedded variable, question feedback cannot be stored or viewed.


### Comprehension Questions

Question-level function: `svlib.enableComprehensionQuestion(this, correctChoices: number[] = [], requiredChoices: number[] = correctChoices);`
Example call: `svlib.enableComprehensionQuestion(this, correctChoices = [1]);`
Example call: `svlib.enableComprehensionQuestion(this, correctChoices = [1, 2]);`
Example call: `svlib.enableComprehensionQuestion(this, requiredChoices = [1]);`

Comprehension questions have two optional arguments: `correctChoices` and `requiredChoices`. Both take an array of integers. `requiredChoices` defaults to `correctChoices`, but these can be set separately.

`correctChoices` specifies choices that are considered correct. Correct choices are highlighted green and increase the respondant's stored comprehension score. Choices that are not specified in `correctChoices` are assumed to be incorrect and are highlighted red.

`requiredChoices` specifies choices that are required to be selected in order to continue. By default, these are the same as `correctChoices` (i.e., demonstration of comprehension is required to continue to the next page). If you want to set a required choice without scoring it (e.g., "By selecting this box, I indicate that I understand and I'm ready to continue."), simply specify `requiredChoices` without specifying `correctChoices`.
