import { normalizeQuestionId } from "./qualtricsUtils";
import { saveSessionJson, loadSessionJson, transferSessionDataToEmbeddedData } from "./storageUtils";
import { NextButtonManager } from "./nextButtonManager";
import debugLib from "debug";
const debug = debugLib("svlib:questionEventUtils");

declare const Qualtrics: any;


export function enableQuestionChoiceLogger(qContext: any): void {
    // Usage: svlib.enableQuestionChoiceLogger(this);
    const handler = new QuestionChoiceListener(qContext, [
        (event: Event) => handler.logEvent(event)
    ]);
    handler.init();
    debug("Enabled question choice logger for %s.", qContext.questionId);
}


export class QuestionChoiceListener {
    private qContext: any
    public callbacks: Array<(event: Event) => void>; // Renamed for clarity
    private questionId: string;
    private choiceInputs: NodeListOf<HTMLInputElement>;

    constructor(qContext: any, callbacks: Array<(event: Event) => void>) {

        localStorage.setItem("debug", "svlib:questionEventUtils"); // Enables debug logging for this class

        this.qContext = qContext;
        this.callbacks = callbacks;
        this.questionId = normalizeQuestionId(qContext.questionId);
        const questionContainer = qContext.getQuestionContainer();
        const choiceContainer = qContext.getChoiceContainer();
        this.choiceInputs = choiceContainer.querySelectorAll("input[type='radio'], input[type='checkbox']");
    }

    public init(): void {
        // this.attachChoiceListeners("click", this.callbacks);
    }

    private attachEventListener(eventType: string): void {
        const questionContainer = this.qContext.getQuestionContainer();
        if (!questionContainer) {
            console.error("No question container found for questionId: %s", this.questionId);
            return;
        }
        questionContainer.addEventListener(eventType, (event: Event) => {
            this.logEvent(event);
        });

        debug("Attached %s event listener to questionId: %s", eventType, this.questionId);
    }

    

    public logEvent(event: Event): void {
        const eventData = {
            targetId: (event.target as HTMLInputElement).id,
            choiceId: (event.target as HTMLInputElement).id.split("-").pop()!,
            eventType: event.type,
            timestamp: new Date().toISOString(),
        };
        debug("Event triggered: %o", eventData);
        debug("Event: %o", event);
    }
}

