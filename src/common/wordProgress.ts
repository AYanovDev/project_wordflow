import type { Word } from "../types";

const STORAGE_KEY = "wordflow-word-progress";
const MAX_PROGRESS = 10;

function getModuleKey(grade: string, module: string) {
  return `${grade}:${module}`;
}

function normaliseProgress(value: unknown) {
  const progress = Number(value);
  return Number.isFinite(progress) ? Math.max(0, Math.min(MAX_PROGRESS, Math.floor(progress))) : 0;
}

function getStoredProgress(grade: string, module: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")[getModuleKey(grade, module)] || {};
  } catch {
    return {};
  }
}

export function addProgressToWords(words: Word[], grade: string, module: string): Word[] {
  const storedProgress = getStoredProgress(grade, module);
  return words.map((word) => ({ ...word, progress: normaliseProgress(storedProgress[word.word] ?? word.progress) }));
}

export function increaseWordProgress(grade: string, module: string, word: string, progress = 0) {
  const nextProgress = Math.min(MAX_PROGRESS, normaliseProgress(progress) + 1);
  try {
    const savedProgress: Record<string, Record<string, number>> = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const moduleKey = getModuleKey(grade, module);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...savedProgress, [moduleKey]: { ...(savedProgress[moduleKey] || {}), [word]: nextProgress } }));
  } catch { /* Storage is optional. */ }
  return nextProgress;
}

export const WORD_PROGRESS_STEPS = MAX_PROGRESS;
