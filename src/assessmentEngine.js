export function validateAnswer(question, response) {
  if (!question) return false;

  if (question.type === "mcq") {
    return response === question.answer;
  }

  if (question.type === "short") {
    if (question.validator?.numeric !== undefined) {
      return Number(response) === question.validator.numeric;
    }

    if (typeof response !== "string") return false;

    const trimmed = response.trim();

    if (!trimmed) return false;

    if (question.validator?.minLength !== undefined && trimmed.length < question.validator.minLength) {
      return false;
    }

    if (Array.isArray(question.validator?.includes)) {
      const normalized = trimmed.toLowerCase();
      const hasAll = question.validator.includes.every((token) =>
        normalized.includes(String(token).toLowerCase())
      );
      if (!hasAll) return false;
    }

    return true;
  }

  return false;
}

export function scoreAssessment(questions, responses) {
  const details = questions.map((question) => {
    const response = responses[question.id];
    const correct = validateAnswer(question, response);
    return {
      id: question.id,
      response,
      correct,
      type: question.type,
      domain: question.domain
    };
  });

  const correctCount = details.filter((item) => item.correct).length;
  const total = questions.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return {
    total,
    correct: correctCount,
    incorrect: total - correctCount,
    percent,
    details,
  };
}
