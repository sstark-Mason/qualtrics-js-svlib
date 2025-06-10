# qualtrics-js-svlib

This library provides functionality for surveys and experiments on Qualtrics.

## Importing this library

1. In the Qualtrics Survey Builder, go to the "Look and feel" tab (paintbrush on the left).
2. Find Look and feel > General > Header.
3. Paste the following into the Header:

```html
    <script src="https://sstark-mason.github.io/qualtrics-js-svlib/dist/svlib.min.js"></script><link rel="stylesheet" type="text/css" href="https://sstark-mason.github.io/qualtrics-js-svlib/dist/svlib.css">
```

Your survey will now the library on page load.

## Using this library

Library functions are namespaced under `svlib`. Most functions are intended to be called from the JavaScript of individual questions. For example:

1. In the Qualtrics Survey Builder, go to the main tab ("Edit question").
2. Select the question you want to add a function to.
3. On the left, select Question behavior > JavaScript.
4. Add the function call under `addOnload` or `addOnReady`. For example:

```javascript
    Qualtrics.SurveyEngine.addOnReady(function()
    {
        svlib.enableFeedbackOnQuestion(this);
        svlib.enableComprehensionQuestion(this, [1]);

    });
```

This enables feedback on `this` question and turns `this` question into a comprehension question with a correct choice of 1 (the first choice option in the survey builder).
