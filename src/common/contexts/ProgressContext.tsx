import { createContext, useContext } from "react";
import { useLearningData } from "./DataContext";

interface ProgressContextValue {}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider() {
  const { grade, module } = useLearningData();
  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}
