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
