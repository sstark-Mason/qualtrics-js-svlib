import anylogger from 'anylogger';
const log = anylogger('comprehensionQuestions.js');

log.log('comprehensionQuestions.js loaded!');


export function comprehensionQuestionSetupMC(opts = {}) {
    // Usage: svlib.comprehensionQuestionSetupMC.call(this, opts);
    // svlib.comprehensionQuestionSetup.call(this, {
    // 	logResponse: false,
    // 	recordResponseHistory: true,
    // 	correctChoices: [1],
    // 	requiredChoices: {
    // 		page: "Comprehension_Examples",
    // 		choices: [1] }
    // });

    if (!opts.logResponse) { opts.logResponse = false; }
    if (!opts.recordResponseHistory) { opts.recordResponseHistory = false; }
    if (!opts.correctChoices) { opts.correctChoices = []; }
    if (!opts.cursedChoices) { opts.cursedChoices = []; }
    if (!opts.verbose) { opts.verbose = false; }
    if (!opts.requiredChoices) { opts.requiredChoices = {}; }

    const questionId = this.questionId;
    const questionContainer = this.getQuestionContainer();
    const choiceElements = questionContainer.querySelectorAll(".choice");
    console.groupCollapsed("comprehensionQuestionSetup(%s)", questionId);

    let revealedChoices = svlib.loadSessionJson(questionId + "_revealedChoices") || [];
    let disabledChoices = svlib.loadSessionJson(questionId + "_disabledChoices") || [];

    

    if (opts.requiredChoices) {
        // Registering this questionId with the page's requiredChoices
        this.disableNextButton();
        const normQuestionId = svlib.normalizeQuestionId(this.questionId);
        const requiredChoices = opts.requiredChoices.choices.sort();
        let requiredChoiceQuestions = svlib.loadSessionJson(opts.requiredChoices.page + "_requiredChoiceQuestions") || [];
        if (!requiredChoiceQuestions.includes(normQuestionId)) {
            requiredChoiceQuestions.push(normQuestionId);
            svlib.saveSessionJson(opts.requiredChoices.page + "_requiredChoiceQuestions", requiredChoiceQuestions);
        }
    }

    // Initial setup on load
    choiceElements.forEach((choiceElement) => {
        const input = choiceElement.querySelector('input[type="radio"], input[type="checkbox"]');
        if (!input) { return; } // Skip if no input found
        const choiceId = parseInt(input.id.split("-").pop(), 10);

        if (opts.correctChoices.includes(choiceId)) {
            choiceElement.dataset.correctness = "correct";
        } else {
            choiceElement.dataset.correctness = "incorrect";
        }

        if (opts.cursedChoices.includes(choiceId)) {
            choiceElement.dataset.cursed = "cursed";
        }

        if (revealedChoices.includes(choiceId)) {
            choiceElement.dataset.revealedColor = "revealed";
        }

        if (disabledChoices.includes(choiceId)) {
            choiceElement.dataset.choiceDisabled = "disabled";
            input.disabled = true; // Disable the input
        }
    })

    // svlib.saveSessionJson(questionId + "_revealedChoices", revealedChoices);
    // svlib.saveSessionJson(questionId + "_disabledChoices", disabledChoices);

    console.groupEnd();

    questionContainer.addEventListener("click", (event) => {
        if (!event.target.matches('input[type="radio"], input[type="checkbox"]')) { return; }
        setTimeout(() => {

            // event.target.blur();
            let choiceElement = event.target.closest(".choice");                
            const thisChoiceText = svlib.getLabelTextMC(event.target);
            const thisChoiceId = parseInt(event.target.id.split("-").pop(), 10);
            const thisChoiceLabel = event.target.labels[0];
            const thisChoiceChecked = event.target.checked; // boolean
            const questionId = event.target.name;
            const normQuestionId = svlib.normalizeQuestionId(questionId);
                

            if (opts.logResponse) { 
                // log.log("%s: Clicked choice '%s' (Id %s, checked=%s)", questionId, thisChoiceText, thisChoiceId, thisChoiceChecked);
                console.groupCollapsed("Clicked choice '%s' (Id %s, checked=%s)", thisChoiceText, thisChoiceId, thisChoiceChecked);
                log.log("event: ", event);
                log.log("event.target: ", event.target);
                log.log("thisChoiceId: ", thisChoiceId);
                log.log("thisChoiceLabel: ", thisChoiceLabel);
                log.log("thisChoiceChecked: ", thisChoiceChecked);
                log.log("event.target.value: ", event.target.value);
                console.groupEnd();
            }

            if (opts.recordResponseHistory) { svlib.updateResponseHistoryMC(questionId, thisChoiceId, thisChoiceText); }

            const selectedChoices = this.getSelectedChoices().map(Number).sort();                
            
            if (opts.correctChoices && opts.correctChoices.length > 0)  {

                // Conditionally disable choices as follows:
                // 1. If the choice is correct, disable upon selection (so that it can't be unselected).
                // 2. If the choice is incorrect, keep it enabled upon selection (so that it must be unselected).
                // 3. If the choice is incorrect, disable it upon de-selection so that it can't be re-selected.
                // 4. Once *all* correct choices have been chosen, disable all *unselected* incorrect choices. *Selected* incorrect choices stay enabled until they're actively unselected.

                // One way to achieve this is to check if all correct answers are selected, then loop through each choice and disable it based on the above rules. I had the idea for another method of doing this that felt like it might've not needed to iterate over each choice in the same way, but I've apparently forgotten it while typing this out.

                console.groupCollapsed("Checking correct choices for %s", questionId);
                const correctChoices = opts.correctChoices.map(Number).sort();

                // Save the selected choice as revealed
                let revealedChoices = svlib.loadSessionJson(questionId + "_revealedChoices") || [];
                revealedChoices = new Set(revealedChoices);
                console.log("Revealed choices: %o", revealedChoices);

                revealedChoices.add(thisChoiceId);
                svlib.saveSessionJson(questionId + "_revealedChoices", Array.from(revealedChoices));
                choiceElement.dataset.revealedColor = "revealed";
                log.log("Revealed choices: %o", revealedChoices);
                console.log("Revealed choices: %o", revealedChoices);

                // This handles multiple-select choices by not disabling incorrect selections, only incorrect de-selections.
                if ((correctChoices.includes(thisChoiceId) && thisChoiceChecked) || (!correctChoices.includes(thisChoiceId) && !thisChoiceChecked)) {
                    choiceElement.dataset.choiceDisabled = "disabled";
                    event.target.disabled = true;
                    
                }

                // If input type is radio, then selecting another choice inherently deselects the previous one. This means we can immediately disable this choice.
                if (event.target.type === "radio") {
                    event.target.disabled = true;
                }

                // Check if all correct choices have been selected
                if (correctChoices.every(choice => selectedChoices.includes(choice))) {
                    // All correct choices have been selected
                    log.log("All correct choices selected for %s. Disabling unselected incorrect choices.", questionId);
                    choiceElements.forEach((choice) => {
                        const input = choice.querySelector('input[type="radio"], input[type="checkbox"]');
                        if (!input) { return; } // Skip if no input found
                        const thatChoiceId = parseInt(input.id.split("-").pop(), 10);
                        if (!selectedChoices.includes(thatChoiceId) && !correctChoices.includes(thatChoiceId)) {
                            choice.dataset.choiceDisabled = "disabled";
                            input.disabled = true;
                        }
                    });
                    
                }
                console.groupEnd();
            }

            if (opts.requiredChoices != {}) {
                console.groupCollapsed("Checking required choices for %s", normQuestionId);
                const requiredChoices = opts.requiredChoices.choices.sort();

                log.log("Required choices: %o", requiredChoices);
                log.log("Selected choices: %o", selectedChoices);

                let requiredChoiceQuestions = svlib.loadSessionJson(opts.requiredChoices.page + "_requiredChoiceQuestions");
                
                
                if (svlib.compareArrays(selectedChoices, requiredChoices)) {
                    log.log("All required choices for %s are passed.", normQuestionId);
                    requiredChoiceQuestions = requiredChoiceQuestions.filter((q) => q !== normQuestionId);
                    
                    if (requiredChoiceQuestions.length == 0) {
                        log.log("All required choices passed for %s. Enabling next button.", opts.requiredChoices.page);
                        this.enableNextButton();
                    }
                } else {
                    log.log("Remaining required questions: %o", requiredChoiceQuestions);
                    if (!requiredChoiceQuestions.includes(normQuestionId)) {
                        requiredChoiceQuestions.push(normQuestionId);
                        this.disableNextButton();
                    }
                }
                svlib.saveSessionJson(opts.requiredChoices.page + "_requiredChoiceQuestions", requiredChoiceQuestions);
                console.groupEnd();
            }
        }, 0);
    });
};