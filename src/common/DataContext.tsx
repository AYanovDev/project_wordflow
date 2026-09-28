import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { LearningData } from "../types";

const STORAGE_KEY = "learningPreferences";
interface LearningContextValue extends LearningData { setLearningData: React.Dispatch<React.SetStateAction<LearningData>>; }
const DataContext = createContext<LearningContextValue | null>(null);

function getSavedPreferences(): LearningData {
  try {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);

    if (!savedPreferences) {
      return { grade: "", module: "" };
    }

    const { grade, module } = JSON.parse(savedPreferences);

    if (!Number.isInteger(grade) || !Number.isInteger(module)) {
      throw new Error("Invalid learning preferences");
    }

    return { grade: String(grade), module: String(module) };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { grade: "", module: "" };
  }
}

export function DataProvider({ children }: PropsWithChildren) {
  const [learningData, setLearningData] = useState(getSavedPreferences);

  useEffect(() => {
    if (!learningData.grade || !learningData.module) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        grade: Number(learningData.grade),
        module: Number(learningData.module),
      }),
    );
  }, [learningData]);

  const value = useMemo(
    () => ({
      grade: learningData.grade,
      module: learningData.module,
      setLearningData,
    }),
    [learningData],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useLearningData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("useLearningData must be used inside a DataProvider");
  }

  return context;
}
