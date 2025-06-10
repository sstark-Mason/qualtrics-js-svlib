import { normalizeQuestionId } from "./qualtricsUtils";
import { saveSessionJson, loadSessionJson, transferSessionDataToEmbeddedData } from "./storageUtils";
import debugLib from "debug";
const debug = debugLib("svlib:questionTimer");
declare const Qualtrics: any;

export function enableQuestionTimer(minutes: number = 0, seconds: number = 0): void {
    // Usage: svlib.enableQuestionTimer(this);

    const timer = new QuestionTimer(minutes, seconds);
    timer.init();

}

export class QuestionTimer {
    private duration: number;
    private startTime: number;
    private elapsedTime: number;

    constructor(minutes: number = 0, seconds: number = 0) {
        this.duration = minutes * 60 + seconds;
        if (this.duration <= 0) {
            throw new Error("Invalid duration for QuestionTimer. Must be greater than 0.");
        }
        this.startTime = Date.now();
        this.elapsedTime = 0;
    }

    public init(): void {
        this.startTimer();
        debug("QuestionTimer initialized with duration %d seconds.", this.duration);
        
        // Optionally, you can set up an interval to check the timer status
        const intervalId = setInterval(() => {
            if (this.getRemainingDuration() <= 0) {
                this.stopTimer();
                clearInterval(intervalId);
                debug("QuestionTimer has ended.");
            }
        }, 1000); // Check every second
    }

    private startTimer(): void {
        this.startTime = Date.now();
        debug("Timer started for %d seconds.", this.duration);
    }

    private stopTimer(): void {
        this.elapsedTime = (Date.now() - this.startTime) / 1000; // Convert to seconds
        debug("Timer stopped. Elapsed time: %d seconds.", this.elapsedTime);
    }

    public getRemainingDuration(): number {
        const elapsed = (this.startTime - Date.now()) / 1000; // Convert to seconds
        const remaining = Math.max(0, this.duration - elapsed);
        debug("Remaining duration: %d seconds.", remaining);
        return remaining;
    }

    // public logElapsedTime(): void {
    //     const elapsed = this.getElapsedTime();
    //     debug("Elapsed time for questionId %s: %d ms", this.questionId, elapsed);
    // }

    // public saveElapsedTimeToEmbeddedData(): void {
    //     const elapsed = this.getElapsedTime();
    //     if (window.Qualtrics && Qualtrics.SurveyEngine) {
    //         Qualtrics.SurveyEngine.setEmbeddedData(`elapsedTime_${this.questionId}`, elapsed);
    //         debug("Saved elapsed time %d ms to embedded data for questionId %s", elapsed, this.questionId);
    //     }
    // }
}
