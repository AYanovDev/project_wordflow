import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "learningPreferences";
const DataContext = createContext(null);

function getSavedPreferences() {
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

export function DataProvider({ children }) {
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
