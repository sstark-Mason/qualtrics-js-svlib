import { normalizeQuestionId } from "./qualtricsUtils";
import { saveSessionJson, loadSessionJson, transferSessionDataToEmbeddedData } from "./storageUtils";
import debugLib from "debug";
const debug = debugLib("svlib:questionEventUtils");

export interface QuestionPassState {
    questionId: string;
    passed: boolean;
}

export class NextButtonManager {
    private static instance: NextButtonManager | null = null;
    private requiredQuestions: QuestionPassState[];

    constructor() {
        localStorage.setItem("debug", "svlib:nextButtonManager"); // Enables debug logging for this class
        this.requiredQuestions = [];
        debug("NextButtonManager initialized with empty required questions list.");
    }

    public static getInstance(): NextButtonManager {
        if (!(window as any).nextButtonManager) {
            (window as any).nextButtonManager = new NextButtonManager();
            debug("Created new instance of NextButtonManager.");
        }
        return (window as any).nextButtonManager;
    }

    public registerQuestion(qContext: any): void {
        const question: QuestionPassState = {
            questionId: normalizeQuestionId(qContext.questionId),
            passed: false // Default state is not passed
        }
        if (!this.requiredQuestions.includes(question)) {
            this.requiredQuestions.push(question);
            qContext.disableNextButton();
            debug("Registered question %o with NextButtonManager.", question);
        } else {
            debug("Question %o is already registered with NextButtonManager.", question);
        }
    }

    public unregisterQuestion(qContext: any): void {
        const questionId = normalizeQuestionId(qContext.questionId);
        this.requiredQuestions = this.requiredQuestions.filter(q => q.questionId !== questionId);
        debug("Unregistered question with id %s from NextButtonManager.", questionId);
    }

    public checkOverallPassState(): boolean {
        if (!this.requiredQuestions || this.requiredQuestions.length === 0) {
            debug("No required questions registered; passing by default.");
            return true; // No required questions means pass by default
        } else if (this.requiredQuestions.every(q => q.passed)) {
            debug("All registered questions passed; returning true.");
            return true; // All registered questions passed
        }
        return false;
    }
    
    public setQuestionPassState(qContext: any, passed: boolean): void {
        const questionId = normalizeQuestionId(qContext.questionId);
        const question = this.requiredQuestions.find(q => q.questionId === questionId);
        if (question) {
            question.passed = passed;
            debug("Set pass state for question %s to %s.", questionId, passed);
        } else {
            debug("Question %s not found in registered questions; cannot set pass state.", questionId);
        }
    }

    public clearQuestions(): void {
        this.requiredQuestions = [];
        debug("Cleared all registered questions from NextButtonManager.");
    }
}