import { useEffect, useState } from "react";
import { celebrate } from "./confetti";
import { useWords } from "../common/WordLoader";

import "./matchTranslation.css";
import { useLearningData } from "../common/DataContext";
import { increaseWordProgress } from "../common/wordProgress";
import { recordSessionResult } from "../common/sessionResults";
import { SessionActions } from "../common/SessionActions";
import "./matchDefinition.css";

const WORDS_PER_ROUND = 5;

function createRound(words) {
  const roundWords = words
    .filter((word) => word.definition)
    .sort(() => Math.random() - 0.5)
    .slice(0, WORDS_PER_ROUND);

  const wordOrder = [...roundWords]
    .sort(() => Math.random() - 0.5)
    .map((word) => word.word);

  return { roundWords, wordOrder };
}

export function MatchDefinition({}) {
  const { grade, module } = useLearningData();
  const words = useWords();
  const [roundWords, setRoundWords] = useState(null); // the words for this round, fixed order
  const [wordOrder, setWordOrder] = useState(null); // shuffled word list for the left column
  const [matchedWords, setMatchedWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // which roundWords entry's definition is shown

  const [correctWord, setCorrectWord] = useState(null);
  const [wrongWord, setWrongWord] = useState(null);
  const [locked, setLocked] = useState(false); // brief lock while feedback plays

  useEffect(() => {
    setMatchedWords([]);
    setCurrentIndex(0);

    const { roundWords, wordOrder } = createRound(words);
    setRoundWords(roundWords);
    setWordOrder(wordOrder);
  }, [words]);

  const target = roundWords ? (roundWords[currentIndex] ?? null) : null;
  const exerciseComplete = matchedWords.length === 1;

  function handleWordClick(word) {
    if (!target || locked || matchedWords.includes(word)) return;

    if (word === target.word) {
      setLocked(true);
      setCorrectWord(word);
      celebrate();

      increaseWordProgress(grade, module, word, target.progress);

      //   setWords((previousWords) =>
      //     previousWords?.map((item) =>
      //       item.word === word ? { ...item, progress: nextProgress } : item,
      //     ),
      //   );
      recordSessionResult("correct");

      setTimeout(() => {
        setMatchedWords((prev) => [...prev, word]);
        setCorrectWord(null);
        setLocked(false);
      }, 500);
    } else {
      setLocked(true);
      setWrongWord(word);
      recordSessionResult("incorrect");

      setTimeout(() => {
        setWrongWord(null);
        setLocked(false);
      }, 500);
    }
  }

  function restartExercise() {
    const { roundWords: nextRoundWords, wordOrder: nextWordOrder } =
      createRound(words);
    setRoundWords(nextRoundWords);
    setWordOrder(nextWordOrder);
    setMatchedWords([]);
    setCurrentIndex(0);
    setCorrectWord(null);
    setWrongWord(null);
    setLocked(false);
  }

  if (!roundWords) {
    return <p className="match-container">Loading exercise…</p>;
  }

  return (
    <div className="match-container">
      <SessionActions className="session-actions" />
      <h1>Match the definition</h1>
      <p className="instructions">
        Click the word that matches the definition shown at the top.
      </p>
      <div className="matching-columns-def">
        {/* WORD COLUMN (clickable) */}
        <div className="matching-column">
          {wordOrder.map((word) => {
            const wordData = roundWords.find((w) => w.word === word);
            const isMatched = matchedWords.includes(word);

            return (
              <div
                key={word}
                onClick={isMatched ? undefined : () => handleWordClick(word)}
                className={`match-card ${isMatched ? "matched" : ""} ${
                  correctWord === word ? "correct" : ""
                } ${wrongWord === word ? "incorrect" : ""}`}
              >
                {wordData.word.charAt(0).toUpperCase() + wordData.word.slice(1)}
              </div>
            );
          })}
        </div>

        {/* DEFINITION COLUMN (single static target, not clickable) */}
        <div className="matching-column-def">
          {target && (
            <div className="match-card definition-card">
              {target.definition}
            </div>
          )}
        </div>
      </div>
      <button className="restart-button" onClick={restartExercise}>
        {exerciseComplete ? "Next" : "Restart"}
      </button>
      {exerciseComplete && (
        <div className="completion-message">
          <h1>Well done! 🎉</h1>
          <p>You matched the definition correctly.</p>
        </div>
      )}
    </div>
  );
}
