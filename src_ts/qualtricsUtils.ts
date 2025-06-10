// src/qualtricsUtils.ts

export function describeThisQuestion(qContext: any): void {
  const questionId = qContext.questionId;
  console.groupCollapsed("describeThisQuestion(%s)", questionId);
  const questionInfo = qContext.getQuestionInfo();
  console.info("Question Info: ", questionInfo);
  const questionChoices = qContext.getChoices();
  console.info("Question Choices: ", questionChoices);
  console.groupEnd();
}

export function normalizeQuestionId(questionId: string): string {
  // Looped questions are prefixed with \d+_. We want to normalize to the base questionId. Example: '1_QID1' -> 'QID1'.
  return questionId.replace(/^\d+_/, '');
}


