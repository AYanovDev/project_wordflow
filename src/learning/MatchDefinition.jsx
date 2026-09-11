import { useWords } from "../common/WordLoader";
import { MatchExercise } from "./MatchTranslation";



function createExercise(words, matchField) {
  const selectedWords = words
    .filter((word) => word[matchField])
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  return {
    english: selectedWords,
    definition: [...selectedWords].sort(() => Math.random() - 0.5),
  };
}

export function MatchDefinition() {
const words = useWords()

  return (
    
  );
}
