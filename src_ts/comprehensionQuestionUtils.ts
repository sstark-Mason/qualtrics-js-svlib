import { normalizeQuestionId } from "./qualtricsUtils";
import { saveSessionJson, loadSessionJson, transferSessionDataToEmbeddedData } from "./storageUtils";
import { QuestionChoiceListener } from "./questionEventUtils";
import { NextButtonManager } from "./nextButtonManager";

import debugLib from "debug";
const debug = debugLib("svlib:comprehensionQuestionUtils");

declare const Qualtrics: any;

export function enableComprehensionQuestion(qContext: any, correctChoices: number[], requiredChoices?: number[]): void {
    
    const comprehensionQuestion = new ComprehensionQuestion(qContext, correctChoices, requiredChoices);
    comprehensionQuestion.init();

}


// export function enableQuestionChoiceComprehension_1(qContext: any, correctChoices: number[]): void {
//     // Usage: svlib.enableQuestionChoiceComprehension(this, correctChoices: [1]);

//     const nextButtonManager = (window as any).nextButtonManager as NextButtonManager;
//     nextButtonManager.registerQuestion(qContext);

//     const correctChoicesString = correctChoices.map(choice => choice.toString());
//     const handler = new QuestionChoiceListener(qContext, [
//         (event: Event) => handler.logEvent(event),
//         (event: Event) => {
//             const correct = handler.checkClickedChoiceCorrectness(event, correctChoicesString);
//             if (correct) {
//                 handler.scoreCorrectness();
//             }
//         },
//         (event: Event) => handler.checkAllChoicesCorrectness(event, correctChoicesString),
//         (event: Event) => {
//             const passed = handler.checkRequiredChoices(event, correctChoicesString);
//             nextButtonManager.setQuestionPassState(qContext, passed);
//             const overallPassed = nextButtonManager.checkOverallPassState();
//             if (overallPassed) {
//                 debug("All required questions passed; enabling next button.");
//                 qContext.enableNextButton();
//             } else {
//                 debug("Not all required questions passed.");
//             }
//         },
//     ]);

//     handler.init();
//     debug("Enabled question choice comprehension for %s.", qContext.questionId);
// }

// export function enableQuestionChoiceRequired(qContext: any, requiredChoices: number[]): void {
//     // Usage: svlib.enableQuestionChoiceRequired(this, requiredChoices: [1]);

//     const nextButtonManager = (window as any).nextButtonManager as NextButtonManager;
//     nextButtonManager.registerQuestion(qContext);

//     const requiredChoicesString = requiredChoices.map(choice => choice.toString());
//     const handler = new QuestionChoiceListener(qContext, [
//         (event: Event) => handler.logEvent(event),
//         (event: Event) => {
//             const passed = handler.checkAllChoicesRequired(event, requiredChoicesString);
//             handler.updateNextManager(passed);
//         },
//     ]);

//     handler.init();
//     debug("Enabled question choice required for %s.", qContext.questionId);
// }


export class ComprehensionQuestion {
    private qContext: any
    private questionId: string;
    private choiceInputs: NodeListOf<HTMLInputElement>;
    private correctChoices: number[];
    private requiredChoices: number[];
    private nextButtonManager: NextButtonManager | null = null;

    constructor(qContext: any, correctChoices: number[] = [], requiredChoices: number[] = correctChoices) {
        this.qContext = qContext;
        this.questionId = normalizeQuestionId(qContext.questionId);
        this.choiceInputs = qContext.getChoiceContainer().querySelectorAll("input[type='radio'], input[type='checkbox']");
        this.correctChoices = correctChoices;
        this.requiredChoices = requiredChoices;
        this.nextButtonManager = NextButtonManager.getInstance();
        this.nextButtonManager.registerQuestion(qContext);

        debug("ComprehensionQuestion instantiated for questionId: %s with correctChoices: %o and requiredChoices: %o", this.questionId, this.correctChoices, this.requiredChoices);
        debug("%s choiceInputs: %o", this.questionId, this.choiceInputs);
    }

    public init(): void {

        localStorage.setItem("debug", "svlib:comprehensionQuestionUtils"); // Enables debug logging for this class

        this.loadChoiceStates();
        debug("%s: Loaded choice states: %o", this.questionId, this.choiceInputs);

        let callbacks: Array<(event: Event) => void> = [];

        if (this.correctChoices.length > 0) {
            callbacks.push((event: Event) => this.checkClickedChoiceCorrectness(event, this.correctChoices));
            callbacks.push((event: Event) => this.checkAllChoicesCorrectness(event, this.correctChoices));
        }

        if (this.requiredChoices.length > 0) {
            callbacks.push((event: Event) => this.checkAllChoicesRequired(event, this.requiredChoices));
            // callbacks.push((event: Event) => this.qContext.updateNextManager(this.checkAllChoicesRequired(event, this.requiredChoices)));
        }

        callbacks.push(() => this.saveChoiceStates());

        // const callbacks = [
        //     (event: Event) => this.checkClickedChoiceCorrectness(event, this.correctChoices),
        //     (event: Event) => this.checkAllChoicesCorrectness(event, this.correctChoices),
        //     () => this.saveChoiceStates(),
        // ];

        this.attachChoiceListeners("click", callbacks);
    }

    private attachChoiceListeners(eventType: string, callbacks: Array<(event: Event) => void>): void {
        for (const input of this.choiceInputs) {
            input.addEventListener(eventType, (event: Event) => {
                setTimeout(() => {
                    callbacks.forEach(cb => cb(event));
                }, 0);
            });
        }
        // this.choiceInputs.forEach((input) => {
        //     input.addEventListener(eventType, (event: Event) => {
        //         setTimeout(() => {
        //             callbacks.forEach(cb => cb(event));
        //         }, 0);
        //     });
        // });
    }

    private checkClickedChoiceCorrectness(event: Event, correctChoices: number[]): boolean {
        debug("%s: Checking clicked choice correctness.", this.questionId);
        const input = event.target as HTMLInputElement;
        const choiceId = parseInt(input.id.split("-").pop()!, 10);      

        debug("%s: Clicked choiceId %s.", this.questionId, choiceId);
        
        if (correctChoices.includes(choiceId)) {
            debug("%s choice %s is correct; marking.", this.questionId, choiceId);
            input.setAttribute("data-correctness", "correct");
            input.disabled = true;
            this.scoreOnCorrectChoiceSelected();
            return true; // Choice is correct
        } else if (!correctChoices.includes(choiceId)) {
            if (input.type === "radio") {
                debug("%s radio choice %s is incorrect; marking and disabling.", this.questionId, choiceId);
                input.setAttribute("data-correctness", "incorrect");
                input.disabled = true;
            } else if (input.type === "checkbox") {
                if (input.checked) {
                    debug("%s checkbox choice %s is incorrect; marking as incorrect.", this.questionId, choiceId);
                    input.setAttribute("data-correctness", "incorrect");
                } else {
                    debug("%s checkbox choice %s is incorrect; disabling after unselect.", this.questionId, choiceId);
                    input.setAttribute("data-correctness", "incorrect");
                    input.disabled = true; // Disable after unselecting
                }
            }
        }
        return false; // Choice is incorrect
    }

    public checkAllChoicesCorrectness(event: Event, correctChoices: number[]): boolean {
        const selectedChoices = this.qContext.getSelectedChoices().map(Number);
        debug("%s: Checking all choices correctness. Selected choices: %o", this.questionId, selectedChoices);

        // Checking if all correct choices are selected
        if (correctChoices.every(choice => selectedChoices.includes(choice))) {
            debug("All correct choices selected for questionId: %s", this.questionId);
            for (const input of this.choiceInputs) {
                if (input.getAttribute("data-correctness") === "incorrect" && input.checked) {
                    debug("Checkbox %s input %s is selected but incorrect; allowing deselection.", this.questionId, input.id);
                    continue; // Allow deselection of selected incorrect choices
                } else {
                    debug("Disabling %s input %s", this.questionId, input.id);
                    input.disabled = true; // Disable all "correct selection state" choices
                }
            }

            // Checking if all selected choices are correct
            if (selectedChoices.every(choice => correctChoices.includes(choice))) {
                debug("All choices are correct for questionId: %s", this.questionId);
                return true;
            }
            
        } else {
            for (const input of this.choiceInputs) {
                if (input.getAttribute("data-correctness") === "incorrect" && !input.checked) {
                    input.disabled = true;
                }
            }
        }
        return false;
    }

    public countCorrectness(correctChoices: number[]): void {
        const numChoices = this.choiceInputs.length;
        let numCorrect = 0;
        let numIncorrect = 0;
        for (const input of this.choiceInputs) {
            if (input.getAttribute("data-correctness") === "correct") {
                numCorrect++;
            } else if (input.getAttribute("data-correctness") === "incorrect") {
                numIncorrect++;
            }
        }
    }

    public scoreCorrectness(numChoices: number, numCorrect: number, numIncorrect: number): number {

        // TODO: To calculate the intended score for multiple-select questions, the selection order is required.
        // Selecting (incorrect, correct, correct) should yield a different score than (correct, incorrect, correct).
        // If we score each time a correct choice is selected, we can give points based on the current state without needing to know the history.

        // Calculate score based on the number of correct and incorrect choices
        const numAttempts = numCorrect + numIncorrect;
        if (numAttempts === 0) {
            return 0; // No attempts made
        }
        const score = (numCorrect / numAttempts) * 100; // PLACEHOLDER FUNCTION
        return score;
    }

    public scoreOnCorrectChoiceSelected(): number {
        // This assumes that a correct choice was just selected, so only call it after a correct choice is selected **and marked correct**.
        // Score = 1 - (numHiddenCorrectChoices / numHiddenChoices)
        const numCorrectChoices = this.correctChoices.length;
        const numRevealedCorrectChoices = Array.from(this.choiceInputs).filter(input => input.getAttribute("data-correctness") === "correct").length;
        const numHiddenCorrectChoices = numCorrectChoices - numRevealedCorrectChoices + 1;
        const numHiddenChoices = Array.from(this.choiceInputs).filter(input => input.getAttribute("data-correctness") === "hidden").length + 1;
        const score = 1 - (numHiddenCorrectChoices / numHiddenChoices);
        debug("%s: Scoring from a correct choice selection. 1 - (numHiddenCorrectChoices / numHiddenChoices): 1 - (%d / %d) = %s.", this.questionId, numHiddenCorrectChoices, numHiddenChoices, score.toFixed(2));
        updateComprehensionScores(this.qContext, score);
        return score
    }

    public checkAllChoicesRequired(event: Event, requiredChoices: number[]): boolean {
        // TODO: Update so that this also checks that "required false" choices are not selected. Implicitly, this is every choice that isn't in requiredChoices.
        debug("Checking required choices for %s:", this.questionId);
        const selectedChoices = this.qContext.getSelectedChoices().map(Number);
        if (requiredChoices.every(choice => selectedChoices.includes(choice))) {
            debug("All required choices selected for questionId: %s", this.questionId);
            // this.nextButtonManager.setQuestionPassState(this.qContext, true);
            return true;
        } else {
            debug("Not all required choices selected for questionId: %s", this.questionId);
            // this.nextButtonManager.setQuestionPassState(this.qContext, false);
            return false;
        }
    }

    public saveChoiceStates(): void {
        const choiceHistory: Record<string, ChoiceState> = {};

        for (const input of this.choiceInputs) {
            const choiceId = input.id.split("-").pop()!;
            choiceHistory[choiceId] = {
                correctness: input.getAttribute("data-correctness") as "correct" | "incorrect" | "hidden",
                selected: input.checked,
                disabled: input.disabled,
            };
        }

        saveSessionJson(this.questionId + "_choiceHistory", choiceHistory);
        debug("Saved choiceStates for %s: %o", this.questionId, choiceHistory);
    }

    public loadChoiceStates(): void {
        const history = loadSessionJson(this.questionId + "_choiceHistory") ?? {};

        for (const input of this.choiceInputs) {
            const choiceId = input.id.split("-").pop()!;
            const state = history[choiceId] as ChoiceState | undefined;

            if (state) {
                input.setAttribute("data-correctness", state.correctness);
                input.checked = state.selected;
                input.disabled = state.disabled;
            } else {
                input.setAttribute("data-correctness", "hidden");
                input.checked = false;
                input.disabled = false;
            }

            this.qContext.setChoiceAnswerValue(choiceId, choiceId, input.checked);
        }
        debug("Loaded choiceStates for %s: %o", this.questionId, history);
    }

}



interface ChoiceState {
    correctness: "correct" | "incorrect" | "hidden";
    selected: boolean;
    disabled: boolean;
}

type ChoiceStates = Record<string, ChoiceState>;

export function updateComprehensionScores(qContext: any, score: number): void {
    let comprehensionScores = loadSessionJson("comprehensionScores") || {};
    const questionId = normalizeQuestionId(qContext.questionId);
    if (!comprehensionScores[questionId]) {
        comprehensionScores[questionId] = [];
    }
    comprehensionScores[questionId].push(score);
    saveSessionJson("comprehensionScores", comprehensionScores);
    debug("Updated comprehension scores for %s: %o", questionId, comprehensionScores[questionId]);
}





// export function enableComprehensionQuestion(qContext: any, correctChoices: string[] = [], requiredChoices: string[] = correctChoices): void {
//     // Usage: svlib.enableComprehensionQuestion(this, ['1']);
//     const widget = new ComprehensionQuestion(qContext, correctChoices, requiredChoices);
//     widget.init();
// }

// class QuestionChoice {
//     public questionId: string;
//     public choiceId: number;
//     public choiceText: string;
//     public choiceElement: HTMLElement;
//     public inputElement: HTMLInputElement;
//     public isCorrect: boolean;
//     public isRequired: boolean;

//     constructor(questionId: string, choiceElement: HTMLElement, isCorrect: boolean = false, isRequired: boolean = false) {
//         this.questionId = questionId;
//         this.choiceElement = choiceElement;
//         this.inputElement = choiceElement.querySelector('input[type="radio"], input[type="checkbox"]') as HTMLInputElement;
//         this.choiceId = parseInt(choiceElement.id.split("-").pop()!, 10);
//         this.choiceText = choiceElement.querySelector('label')?.textContent?.trim() || '';
//         this.isCorrect = isCorrect;
//         this.isRequired = isRequired;
//     }
// }

// export class ComprehensionQuestion {
//     private qContext: any;
//     private questionId: string;
//     private questionContainer: HTMLElement;
//     private choiceElements: NodeListOf<HTMLElement>;
//     private selectedChoices: string[];
//     private correctChoices: string[];
//     private requiredChoices: string[];
//     private revealedChoices: string[];
//     private static nextButtonManager: NextButtonManager | null = null;
//     private choices: QuestionChoice[] = [];

//     constructor(qContext: any, 
//                 correctChoices: string[] = [], 
//                 requiredChoices: string[] = correctChoices,
//             ) {
//         this.qContext = qContext;
//         this.questionId = normalizeQuestionId(qContext.questionId);
//         this.questionContainer = qContext.getQuestionContainer();
//         this.choiceElements = this.questionContainer.querySelectorAll(".choice");
//         this.choices = Array.from(this.choiceElements).map(choice => new QuestionChoice(this.questionId, choice));
//         this.correctChoices = correctChoices.map(choice => choice.toString());
//         this.requiredChoices = requiredChoices.map(choice => choice.toString());
//         this.selectedChoices = qContext.getSelectedChoices()//.map(choice => choice.toString());

//         if (!ComprehensionQuestion.nextButtonManager) {
//             ComprehensionQuestion.nextButtonManager = new NextButtonManager();
//         }
//         ComprehensionQuestion.nextButtonManager.registerQuestion(this);
//         debug("ComprehensionQuestion initialized for questionId: %s", this.questionId);
//     }

//     public init(): void {
//         this.ensureQuestionIsMC();
//         this.attachEvents();
//         this.loadHistory();
//     }

//     private ensureQuestionIsMC(): void {
//         if (this.choiceElements.length === 0) {
//             throw new Error("No choice elements found in the question container.");
//         }
//     }


//     private attachEvents(): void {
//         this.choiceElements.forEach(choice => {
//             choice.addEventListener("click", () => this.handleChoiceClick());
//         });
//     }

//     private handleChoiceClick(): void {
//         // We'll iterate through each choice, which handles the case of refreshing on multiple-select (since Qualtrics isn't consistent with what's selected after a refresh). If we don't do this, then the questionHistory might remember an incorrect choice being selected before the refresh, but fail to update if the incorrect choice isn't selected after refresh.

//         this.selectedChoices = this.qContext.getSelectedChoices();
//         debug("Selected choices updated: %o", this.selectedChoices);

//         this.checkCorrectChoices();
//         this.checkRequiredChoices();

//     }

//     private checkCorrectChoices(): void {
        
//         this.choices.forEach(choice => {
//             if (this.correctChoices.includes(choice.choiceId.toString())) {
//                 choice.isCorrect = true;
//                 choice.choiceElement.dataset.correctness = "correct";
//             } else {
//                 choice.isCorrect = false;
//                 choice.choiceElement.dataset.correctness = "incorrect";
//             }

//             if (this.selectedChoices.includes(choice.choiceId.toString())) {
//                 choice.inputElement.checked = true;
//             } else {
//                 choice.inputElement.checked = false;
//             }
//         })
//     }

//     private checkRequiredChoices(): void {
//     }

//     private saveChoices(): void {
//     }

//     private loadHistory(): void {
//     }


//     // The MC question should check if it has been passed. If passed, then it can ask the NextButtonManager to check the overall pass state (we don't need to ask for this check if the question knows that it hasn't been passed itself).

//     public isPassed(): boolean {
//             return this.requiredChoices.every(choice => this.selectedChoices.includes(choice));
//     }


// }

// export class NextButtonManager {
//     private requiredQuestions: ComprehensionQuestion[];

//     public registerQuestion(question: ComprehensionQuestion): void {
//         if (!this.requiredQuestions) {
//             this.requiredQuestions = [];
//         }
//         this.requiredQuestions.push(question);
//     }

//     public checkPassState(): boolean {
//         if (!this.requiredQuestions || this.requiredQuestions.length === 0) {
//             return true; // No required questions, so pass state is true
//         }
//         return this.requiredQuestions.every(question => question.isPassed());
//     }

//     public updateNextButtonState(): void {
//         const nextButton = document.querySelector(".NextButton");
//         if (nextButton) {
//             if (this.checkPassState()) {
//                 nextButton.classList.remove("disabled");
//                 nextButton.removeAttribute("disabled");
//             } else {
//                 nextButton.classList.add("disabled");
//                 nextButton.setAttribute("disabled", "true");
//             }
//         }
//     }

    

// }

// // interface FeedbackOnQuestionOptions {
// //     logResponse?: boolean;
// //     recordResponseHistory?: boolean;
// //     correctChoices?: number[];
// //     cursedChoices?: number[];
// //     verbose?: boolean;
// //     requiredChoices?: { choices: number[]; page?: string };
// // }

// // export class FeedbackOnQuestion {
// //     private questionId: string;
// //     private questionContainer: HTMLElement;
// //     private choiceElements: NodeListOf<HTMLElement>;
// //     private opts: FeedbackOnQuestionOptions;
// //     private svlib: any;

// //     constructor(qContext: any, opts: FeedbackOnQuestionOptions = {}, svlib: any) {
// //         this.svlib = svlib;
// //         this.questionId = qContext.questionId;
// //         this.questionContainer = qContext.getQuestionContainer();
// //         this.choiceElements = this.questionContainer.querySelectorAll(".choice");
// //         this.opts = {
// //             logResponse: false,
// //             recordResponseHistory: false,
// //             correctChoices: [],
// //             cursedChoices: [],
// //             verbose: false,
// //             requiredChoices: {},
// //             ...opts,
// //         };
// //     }

// //     public init(): void {
// //         this.setupChoices();
// //         this.attachEvents();
// //     }

// //     private setupChoices(): void {
// //         const { correctChoices = [], cursedChoices = [] } = this.opts;
// //         let revealedChoices = this.svlib.loadSessionJson(this.questionId + "_revealedChoices") || [];
// //         let disabledChoices = this.svlib.loadSessionJson(this.questionId + "_disabledChoices") || [];

// //         this.choiceElements.forEach((choiceElement: HTMLElement) => {
// //             const input = choiceElement.querySelector('input[type="radio"], input[type="checkbox"]');
// //             if (!input) return;
// //             const choiceId = parseInt(input.id.split("-").pop()!, 10);

// //             choiceElement.dataset.correctness = correctChoices.includes(choiceId) ? "correct" : "incorrect";
// //             if (cursedChoices.includes(choiceId)) {
// //                 choiceElement.dataset.cursed = "cursed";
// //             }
// //             if (revealedChoices.includes(choiceId)) {
// //                 choiceElement.dataset.revealedColor = "revealed";
// //             }
// //             if (disabledChoices.includes(choiceId)) {
// //                 choiceElement.dataset.choiceDisabled = "disabled";
// //                 (input as HTMLInputElement).disabled = true;
// //             }
// //         });

// //         // Required choices setup
// //         if (this.opts.requiredChoices) {
// //             this.disableNextButton();
// //             const normQuestionId = this.svlib.normalizeQuestionId(this.questionId);
// //             const requiredChoices = this.opts.requiredChoices.choices.sort();
// //             let requiredChoiceQuestions = this.svlib.loadSessionJson(this.opts.requiredChoices.page + "_requiredChoiceQuestions") || [];
// //             if (!requiredChoiceQuestions.includes(normQuestionId)) {
// //                 requiredChoiceQuestions.push(normQuestionId);
// //                 this.svlib.saveSessionJson(this.opts.requiredChoices.page + "_requiredChoiceQuestions", requiredChoiceQuestions);
// //             }
// //         }
// //     }

// //     private attachEvents(): void {
// //         this.questionContainer.addEventListener("click", (event: Event) => {
// //             const target = event.target as HTMLElement;
// //             if (!target.matches('input[type="radio"], input[type="checkbox"]')) return;
// //             setTimeout(() => this.handleChoiceClick(target as HTMLInputElement), 0);
// //         });
// //     }

// //     private handleChoiceClick(input: HTMLInputElement): void {
// //         const choiceElement = input.closest(".choice") as HTMLElement;
// //         const thisChoiceText = this.svlib.getLabelTextMC(input);
// //         const thisChoiceId = parseInt(input.id.split("-").pop()!, 10);
// //         const thisChoiceChecked = input.checked;
// //         const questionId = input.name;
// //         const normQuestionId = this.svlib.normalizeQuestionId(questionId);

// //         if (this.opts.logResponse) {
// //             // Logging logic...
// //             console.groupCollapsed("Clicked choice '%s' (Id %s, checked=%s)", thisChoiceText, thisChoiceId, thisChoiceChecked);
// //             this.svlib.log("event.target: ", input);
// //             this.svlib.log("thisChoiceId: ", thisChoiceId);
// //             this.svlib.log("thisChoiceChecked: ", thisChoiceChecked);
// //             this.svlib.log("event.target.value: ", input.value);
// //             console.groupEnd();
// //         }

// //         if (this.opts.recordResponseHistory) {
// //             this.svlib.updateResponseHistoryMC(questionId, thisChoiceId, thisChoiceText);
// //         }

// //         const selectedChoices = Array.from(this.questionContainer.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked'))
// //             .map((el: any) => parseInt(el.id.split("-").pop(), 10))
// //             .sort();

// //         // Correct choices logic
// //         if (this.opts.correctChoices && this.opts.correctChoices.length > 0) {
// //             const correctChoices = this.opts.correctChoices.map(Number).sort();
// //             let revealedChoices = this.svlib.loadSessionJson(this.questionId + "_revealedChoices") || [];
// //             revealedChoices = new Set(revealedChoices);
// //             revealedChoices.add(thisChoiceId);
// //             this.svlib.saveSessionJson(this.questionId + "_revealedChoices", Array.from(revealedChoices));
// //             choiceElement.dataset.revealedColor = "revealed";

// //             if ((correctChoices.includes(thisChoiceId) && thisChoiceChecked) || (!correctChoices.includes(thisChoiceId) && !thisChoiceChecked)) {
// //                 choiceElement.dataset.choiceDisabled = "disabled";
// //                 input.disabled = true;
// //             }

// //             if (input.type === "radio") {
// //                 input.disabled = true;
// //             }

// //             if (correctChoices.every(choice => selectedChoices.includes(choice))) {
// //                 this.choiceElements.forEach((choice: HTMLElement) => {
// //                     const input = choice.querySelector('input[type="radio"], input[type="checkbox"]') as HTMLInputElement;
// //                     if (!input) return;
// //                     const thatChoiceId = parseInt(input.id.split("-").pop()!, 10);
// //                     if (!selectedChoices.includes(thatChoiceId) && !correctChoices.includes(thatChoiceId)) {
// //                         choice.dataset.choiceDisabled = "disabled";
// //                         input.disabled = true;
// //                     }
// //                 });
// //             }
// //         }

// //         // Required choices logic
// //         if (this.opts.requiredChoices && Object.keys(this.opts.requiredChoices).length > 0) {
// //             const requiredChoices = this.opts.requiredChoices.choices.sort();
// //             let requiredChoiceQuestions = this.svlib.loadSessionJson(this.opts.requiredChoices.page + "_requiredChoiceQuestions");

// //             if (this.svlib.compareArrays(selectedChoices, requiredChoices)) {
// //                 requiredChoiceQuestions = requiredChoiceQuestions.filter((q: string) => q !== normQuestionId);
// //                 if (requiredChoiceQuestions.length === 0) {
// //                     this.enableNextButton();
// //                 }
// //             } else {
// //                 if (!requiredChoiceQuestions.includes(normQuestionId)) {
// //                     requiredChoiceQuestions.push(normQuestionId);
// //                     this.disableNextButton();
// //                 }
// //             }
// //             this.svlib.saveSessionJson(this.opts.requiredChoices.page + "_requiredChoiceQuestions", requiredChoiceQuestions);
// //         }
// //     }

// //     private disableNextButton(): void {
// //         if (typeof this.svlib.disableNextButton === "function") {
// //             this.svlib.disableNextButton();
// //         }
// //     }

// //     private enableNextButton(): void {
// //         if (typeof this.svlib.enableNextButton === "function") {
// //             this.svlib.enableNextButton();
// //         }
// //     }
// // }
