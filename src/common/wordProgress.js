const STORAGE_KEY = "wordflow-word-progress";
const MAX_PROGRESS = 10;

function getModuleKey(grade, module) {
  return `${grade}:${module}`;
}

function normaliseProgress(value) {
  const progress = Number(value);
  return Number.isFinite(progress)
    ? Math.max(0, Math.min(MAX_PROGRESS, Math.floor(progress)))
    : 0;
}

function getStoredProgress(grade, module) {
  try {
    const savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return savedProgress[getModuleKey(grade, module)] || {};
  } catch {
    return {};
  }
}

export function addProgressToWords(words, grade, module) {
  const storedProgress = getStoredProgress(grade, module);

  return words.map((word) => ({
    ...word,
    progress: normaliseProgress(storedProgress[word.word] ?? word.progress),
  }));
}

export function increaseWordProgress(grade, module, word, progress) {
  const nextProgress = Math.min(MAX_PROGRESS, normaliseProgress(progress) + 1);

  try {
    const savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const moduleKey = getModuleKey(grade, module);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...savedProgress,
        [moduleKey]: {
          ...(savedProgress[moduleKey] || {}),
          [word]: nextProgress,
        },
      }),
    );
  } catch {
    // The current session can still show progress if browser storage is unavailable.
  }

  return nextProgress;
}

export const WORD_PROGRESS_STEPS = MAX_PROGRESS;
