import { normalizeQuestionId } from "./qualtricsUtils";

declare const Qualtrics: any;

export function enableFeedbackOnQuestion(qContext: any, options?: FeedbackOptions): void {
    // Usage: svlib.enableFeedbackOnQuestion(this);
    const widget = new FeedbackOnQuestion(qContext, options);
    widget.init();
}

export interface FeedbackOptions {
  /** Icon when closed with no feedback */
  closedIconEmpty?: string;
  /** Icon when closed with feedback saved */
  closedIconFilled?: string;
  /** Icon when textarea is open */
  openedIcon?: string;
  /** Suffix for sessionStorage key */
  storageKeySuffix?: string;
}

const DEFAULTS: Required<FeedbackOptions> = {
  closedIconEmpty: "🗨️",
  closedIconFilled: "💬",
  openedIcon: "✔️",
  storageKeySuffix: "_feedback",
};

export class FeedbackOnQuestion {
    private questionId: string;
    private qdWrapper: HTMLElement;
    private button!: HTMLButtonElement;
    private textarea!: HTMLTextAreaElement;
    private opts: Required<FeedbackOptions>;

    constructor(
        private qContext: any,
        options: FeedbackOptions = {}
    ) {
        this.questionId = normalizeQuestionId(qContext.questionId);
        const questionContainer = qContext.getQuestionContainer();
        this.qdWrapper = questionContainer.querySelector(".question-display-wrapper");
        this.opts = { ...DEFAULTS, ...options };
    }

    public init(): void {
        this.ensureWrapper();
        this.createElements();
        this.appendElements();
        this.attachEvents();
        this.loadSavedFeedback();
    }

    private ensureWrapper(): void {
        // make positioning-relative if needed
        if (getComputedStyle(this.qdWrapper).position === "static") {
            this.qdWrapper.style.position = "relative";
        }
        this.qdWrapper.classList.add("feedback-wrapper");
    }

    private createElements(): void {
        // button
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.classList.add("feedback-button");
        this.button.textContent = this.opts.closedIconEmpty;
        this.button.title = "Have feedback?";
        this.button.setAttribute("aria-expanded", "false");

        // textarea
        this.textarea = document.createElement("textarea");
        this.textarea.classList.add("feedback-textarea");
        this.textarea.placeholder = "Please enter any comments about this question here.";
    }

    private appendElements(): void {
        this.qdWrapper.append(this.button, this.textarea);
    }

    private attachEvents(): void {
        this.button.addEventListener("click", () => this.toggleTextarea());
        this.textarea.addEventListener("blur", (e) => {
            this.saveFeedback();
            this.updateButtonIcon();
            const related = (e as FocusEvent).relatedTarget;
            if (related !== this.button) {
                this.hideTextarea();
            }
        });
    }

    private toggleTextarea(): void {
        const isOpen = this.textarea.classList.toggle("open");
        this.button.setAttribute("aria-expanded", String(isOpen));
        this.updateButtonIcon(isOpen);
        if (isOpen) {
            const gap = 5;
            const offset = this.button.offsetWidth + gap;
            this.textarea.style.right = `${offset}px`;
            this.textarea.focus();
        } else {
            this.hideTextarea();
            this.saveFeedback();
        }
    }

    private hideTextarea(): void {
        this.textarea.classList.remove("open");
        this.button.setAttribute("aria-expanded", "false");
        this.updateButtonIcon(false);
        this.textarea.style.removeProperty("right");
    }

    private updateButtonIcon(isOpen: boolean = false): void {
        if (isOpen) {
            this.button.textContent = this.opts.openedIcon;
            this.button.style.transform = "scaleX(1)";
        } else if (this.textarea.value.trim()) {
            this.button.textContent = this.opts.closedIconFilled;
            this.button.style.transform = "scaleX(-1)";
        } else {
            this.button.textContent = this.opts.closedIconEmpty;
            this.button.style.transform = "scaleX(1)";
        }
    }

    private saveFeedback(): void {
        const key = this.questionId + this.opts.storageKeySuffix;
        const val = this.textarea.value.trim();
        if (val) {
            sessionStorage.setItem(key, val);
        } else {
            sessionStorage.removeItem(key);
        }
    }

    private loadSavedFeedback(): void {
        const key = this.questionId + this.opts.storageKeySuffix;
        const saved = sessionStorage.getItem(key);
        if (saved) {
            this.textarea.value = saved;
            this.updateButtonIcon(false);
        }
    }
}

export function storeAllSessionFeedbackAsEmbeddedData(): void {
    // Usage: svlib.storeAllSessionFeedbackAsEmbeddedData(); // Use once per page load
    try {
        const feedbackKeys = Object.keys(sessionStorage).filter(key => key.endsWith("_feedback"));
        const feedbackData = {};
        feedbackKeys.forEach(key => {
            try {
                const questionId = key.split("_")[0]; // Extract questionId from key
                const feedback = sessionStorage.getItem(key);
                feedbackData[questionId] = feedback;
            } catch (error) {
                console.error("Error processing feedback for key %s: %s", key, error);
            }
        })
        Qualtrics.SurveyEngine.setJSEmbeddedData("questionFeedbackJSON", JSON.stringify(feedbackData));
    } catch (error) {
        console.error("Error storing session feedback as embedded data: %s", error);
    }
}


