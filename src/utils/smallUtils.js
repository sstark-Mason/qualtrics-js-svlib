import { default as anylogger } from "anylogger";
const log = anylogger('smallUtils.js');


export function normalizeQuestionId(questionId) {
    // Usage: svlib.normalizeQuestionId.call(this, questionId);
    if (questionId) {
        // Looped questions are prefixed with \d+_. We want to normalize to the base questionId.
        // Example: '1_QID1' -> 'QID1'
        questionId = questionId.replace(/^\d+_/, '');
    }
    return questionId;
};

export function compareArrays(arr1, arr2) {
    // Usage: svlib.compareArrays(arr1, arr2);
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
};



export function shuffleArray(array) {
    // Usage: svlib.shuffleArray(array);
        for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
