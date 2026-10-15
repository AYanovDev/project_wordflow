import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Navigate } from "react-router-dom";

import { useLearningData } from "./DataContext";
import { LoadingPage } from "../LoadingPage";
import { useProgress } from "./ProgressContext";
import type { Word } from "../../types";

const WordContext = createContext<Word[] | null>(null);

export function WordLoader({ children }: PropsWithChildren) {
  const { grade, module } = useLearningData();
  const { addProgressToWords, filterIncompleteWords } = useProgress();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Word[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!grade || !module) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isActive = true;
    const url = `/word_data/grade_${grade}/module_${module}.json`;

    setIsLoading(true);
    setErrorMessage(null);

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Vocabulary file could not be loaded.");
        }

        return response.json() as Promise<Word[]>;
      })
      .then((d) => {
        if (isActive) {
          setData(addProgressToWords(filterIncompleteWords(d)));
        }
      })
      .catch((error) => {
        if (isActive && error.name !== "AbortError") {
          setErrorMessage("We couldn't load this vocabulary module yet.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [addProgressToWords, filterIncompleteWords, grade, module]);

  if (!grade || !module) {
    return <Navigate to="/quest" replace />;
  }

  if (isLoading) {
    return <LoadingPage grade={grade} module={module} />;
  }

  if (errorMessage) {
    return <p role="alert">{errorMessage}</p>;
  }

  if (data) {
    return <WordContext.Provider value={data}>{children}</WordContext.Provider>;
  }

  return null;
}

export function useWords() {
  const context = useContext(WordContext);

  if (!context) {
    throw new Error("useWords must be used inside a WordLoader");
  }

  return context;
}
