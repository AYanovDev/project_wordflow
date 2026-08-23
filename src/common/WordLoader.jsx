import { useEffect, useState } from "react";
import { WordCards } from "../presentation/WordCards";

export function WordLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let learningPreferences = JSON.parse(
      localStorage.getItem("learningPreferences"),
    );
    let url = `/word_data/grade_${learningPreferences.grade}/module_${learningPreferences.module}.json`;
    setIsLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div>
        <p>Loading</p>
      </div>
    );
  }

  if (data) {
    return <WordCards words={data}></WordCards>;
  }
}
