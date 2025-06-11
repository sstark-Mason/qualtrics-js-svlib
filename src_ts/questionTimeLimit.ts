import { normalizeQuestionId } from "./qualtricsUtils";
import { saveSessionJson, loadSessionJson, transferSessionDataToEmbeddedData } from "./storageUtils";
import debugLib from "debug";
const debug = debugLib("svlib:questionTimer");
declare const Qualtrics: any;

export function enableQuestionTimer(this: any, interval: number = 1, timeLimit: number = 0, enforceFocus: boolean = false, displayTimer: boolean = false): void {
    // Usage: svlib.enableQuestionTimer(this);
    // const timer = new TimeLimitTimer(this, interval, timeLimit, () => {
    //     debug("Time limit reached for question %s, executing onTimeUp callback.", this.questionId);
    //     this.onTimeUp();
    // });

    const timer = new TimeLimitTimer(this, interval, timeLimit);
    timer.init();


}

export class TimeLimitTimer {
    private qContext: any;
    private questionId: string;
    private interval: number;
    private timeLimit: number;
    private intervalId: number | null = null;
    private startTime: number;
    private elapsedTime: number;
    private penaltyCount: number = 0;

    constructor(qContext: any, interval: number, timeLimit: number) {
        this.qContext = qContext;
        this.questionId = normalizeQuestionId(this.qContext.questionId);
        this.interval = interval * 1000; // Convert seconds to milliseconds
        this.timeLimit = timeLimit * 1000; // Convert seconds to milliseconds
        this.startTime = Date.now();
        this.elapsedTime = 0;
    }

    public init(): void {

        localStorage.setItem("debug", "svlib:questionTimeLimit"); // Enables debug logging for this class

        // Load saved timer state if available
        const savedState = loadSessionJson(this.questionId + "_timer");
        if (savedState) {
            this.startTime = savedState.startTime;
            this.elapsedTime = savedState.elapsedTime;
            this.penaltyCount = savedState.penaltyCount;
            debug("Loaded saved timer state for question %s: %o", this.questionId, savedState);
        } else {
            debug("No saved timer state found for question %s; starting new timer.", this.questionId);
        }
        
        this.start();

    }

    public start(): void {
        this.startTime = Date.now();
        this.intervalId = window.setInterval(() => {
            this.onTick();
        }, this.interval);
    }

    public stop(): void {
        if (this.intervalId) {
            this.elapsedTime += Date.now() - this.startTime;
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private onTick(): void {
        const now = Date.now();
        this.elapsedTime += now - this.startTime;
        this.startTime = now;
        this.saveTimerState();

        if (this.elapsedTime >= this.timeLimit) {
            this.stop();
            this.forceAdvance();
            debug("Time limit reached for question %s.", this.questionId);
        }
    }

    public saveTimerState(): void {
        const state = {
            startTime: this.startTime,
            elapsedTime: this.elapsedTime,
            penaltyCount: this.penaltyCount,
        };
        saveSessionJson(this.questionId + "_timer", state);
        debug("Saved timer state for question %s: %o", this.questionId, state);
    }

    public forceAdvance(): void {
        this.stop();
        this.qContext.clickNextButton();
        debug("Forced advance for question %s.", this.questionId);
    }
}