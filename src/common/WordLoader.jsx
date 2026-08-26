import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { WordCards } from "../presentation/WordCards";
import { useLearningData } from "./DataContext";
import { LoadingPage } from "./LoadingPage";
import { addProgressToWords } from "./wordProgress";

export function WordLoader() {
  const { grade, module } = useLearningData();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

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

        return response.json();
      })
      .then((d) => {
        if (isActive) {
          setData(addProgressToWords(d, grade, module));
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
  }, [grade, module]);

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
    return <WordCards words={data} />;
  }

  return null;
}
