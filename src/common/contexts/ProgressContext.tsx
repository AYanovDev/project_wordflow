import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useLearningData } from "./DataContext";
import { WORD_PROGRESS_STEPS } from "../wordProgress";
import type { Word } from "../../types";

const STORAGE_KEY = "wordflow-word-progress";
const MAX_PROGRESS = WORD_PROGRESS_STEPS;

type ProgressByModule = Record<string, Record<string, number>>;

interface ProgressContextValue {
  addProgressToWords: (words: Word[]) => Word[];
  filterIncompleteWords: (words: Word[]) => Word[];
  increaseProgress: (word: string, currentProgress?: number) => number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function getModuleKey(grade: string, module: string) {
  return `${grade}:${module}`;
}

function normaliseProgress(value: unknown) {
  const progress = Number(value);
  return Number.isFinite(progress)
    ? Math.max(0, Math.min(MAX_PROGRESS, Math.floor(progress)))
    : 0;
}

function getStoredProgress(): ProgressByModule {
  try {
    const storedProgress: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}",
    );

    return storedProgress && typeof storedProgress === "object"
      ? (storedProgress as ProgressByModule)
      : {};
  } catch {
    return {};
  }
}

export function ProgressProvider({ children }: PropsWithChildren) {
  const { grade, module } = useLearningData();
  const [progressByModule, setProgressByModule] = useState(getStoredProgress);
  const progressRef = useRef(progressByModule);

  const addProgressToWords = useCallback(
    (words: Word[]) => {
      const savedProgress = progressRef.current[getModuleKey(grade, module)] || {};

      return words.map((word) => ({
        ...word,
        progress: normaliseProgress(savedProgress[word.word] ?? word.progress),
      }));
    },
    [grade, module],
  );

  const filterIncompleteWords = useCallback(
    (words: Word[]) => {
      const savedProgress = progressRef.current[getModuleKey(grade, module)] || {};

      return words.filter(
        (word) => normaliseProgress(savedProgress[word.word] ?? word.progress) < MAX_PROGRESS,
      );
    },
    [grade, module],
  );

  const increaseProgress = useCallback(
    (word: string, currentProgress = 0) => {
      const moduleKey = getModuleKey(grade, module);
      const moduleProgress = progressRef.current[moduleKey] || {};
      const nextProgress = Math.min(
        MAX_PROGRESS,
        normaliseProgress(moduleProgress[word] ?? currentProgress) + 1,
      );
      const nextProgressByModule = {
        ...progressRef.current,
        [moduleKey]: { ...moduleProgress, [word]: nextProgress },
      };

      progressRef.current = nextProgressByModule;
      setProgressByModule(nextProgressByModule);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgressByModule));
      } catch {
        // Storage is optional; progress remains available for this session.
      }

      return nextProgress;
    },
    [grade, module],
  );

  return (
    <ProgressContext.Provider
      value={{ addProgressToWords, filterIncompleteWords, increaseProgress }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgress must be used inside a ProgressProvider");
  }

  return context;
}
