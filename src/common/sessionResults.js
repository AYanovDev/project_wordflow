const STORAGE_KEY = "wordflow-session-results";

const EMPTY_RESULTS = { correct: 0, incorrect: 0 };

export function getSessionResults() {
  try {
    const savedResults = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    return {
      correct: Number.isFinite(savedResults?.correct) ? savedResults.correct : 0,
      incorrect: Number.isFinite(savedResults?.incorrect) ? savedResults.incorrect : 0,
    };
  } catch {
    return { ...EMPTY_RESULTS };
  }
}

export function recordSessionResult(result) {
  if (result !== "correct" && result !== "incorrect") return;

  const results = getSessionResults();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...results, [result]: results[result] + 1 }),
  );
}

export function resetSessionResults() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(EMPTY_RESULTS));
}
