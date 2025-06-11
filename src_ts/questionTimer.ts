import { normalizeQuestionId } from "./qualtricsUtils";
import { saveSessionJson, loadSessionJson, transferSessionDataToEmbeddedData } from "./storageUtils";
import debugLib from "debug";
const debug = debugLib("svlib:questionTimer");
declare const Qualtrics: any;

let timerInstance: BaseTimer | null = null;

export function enableQuestionTimer(this: any, interval: number = 1, timeLimit: number = 0, enforceFocus: boolean = false, displayTimer: boolean = false): void {
    // Usage: svlib.enableQuestionTimer(this);
    const questionId = normalizeQuestionId(this.questionId);

    if (!timerInstance) {

        if (timeLimit > 0) {
            timerInstance = new TimeLimitTimer(questionId, interval, timeLimit, () => {})
        } else {
            timerInstance = new SimpleTimer(questionId, interval);
        }
    }
    timerInstance.start();

}

function saveTimerState(questionId: string, timer: BaseTimer): void {
    const state = {
        startTime: timer.startTime,
        elapsedTime: timer.elapsedTime,
    };
    saveSessionJson(questionId + "_timerState", state);
}



abstract class BaseTimer {
    public questionId: string;
    protected interval: number;
    public startTime: number;
    public elapsedTime: number;
    protected intervalId: number | null; // ReturnType<typeof setInterval> | null = null;

    constructor(questionId: string, interval: number = 1) {
        this.questionId = normalizeQuestionId(questionId);
        this.interval = interval * 1000; // Convert seconds to milliseconds
        this.elapsedTime = 0;
    }

    public start(): void {
        this.startTime = Date.now();
        this.intervalId = window.setInterval(() => {
            this.onTick();
        }, this.interval);
    }

    public stop(): void {
        if (this.intervalId) {
            this.getElapsedTime();
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    public getElapsedTime(): number {
        return Date.now() - this.startTime;
    }

    protected abstract onTick(): void;
}


export class SimpleTimer extends BaseTimer {
    protected onTick(): void {
        this.elapsedTime = this.getElapsedTime();
        console.log("Elapsed time: %d s", this.elapsedTime / 1000);
    }
}


export class TimeLimitTimer extends BaseTimer {
    private timeLimit: number;
    private onExpireCallback?: () => void;

    constructor(questionId, interval: number = 1, timeLimit: number = 0, onExpireCallback?: () => void) {
        super(questionId, interval);
        this.timeLimit = timeLimit * 1000; // Convert seconds to milliseconds
        this.onExpireCallback = onExpireCallback;
    }

    protected onTick(): void {
        this.elapsedTime = this.getElapsedTime();
        sessionStorage.setItem(this.questionId + "_elapsedTime", this.elapsedTime.toString());
        if (this.elapsedTime >= this.timeLimit) {
            this.stop();
            if (this.onExpireCallback) {
                this.onExpireCallback();
            }
            console.log("Time limit reached. Timer stopped.");
        } else {
            console.log("Elapsed time: %d s", this.elapsedTime / 1000);
        }
    }

    public reset(): void {
        this.stop();
        this.elapsedTime = 0;
    }

    public getRemainingTime(): number {
        return Math.max(0, this.timeLimit - this.elapsedTime);
    }

    protected onExpire(): void {}
}
