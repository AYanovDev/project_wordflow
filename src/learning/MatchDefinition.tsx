import { startTransition, useEffect, useMemo, useState, ViewTransition } from "react";
import { celebrate } from "./confetti";
import { useWords } from "../common/contexts/WordLoader";

import "./matchTranslation.css";
import { useProgress } from "../common/contexts/ProgressContext";
import { recordSessionResult } from "../common/sessionResults";
import { SessionActions } from "../common/SessionActions";
import "./matchDefinition.css";
import type { Word } from "../types";
import { RefreshIcon } from "../icons/RefreshIcon";
import { useSettings } from "../common/settings/SettingsContext";
import { SettingsControl } from "../common/settings/SettingsControl";

const WORDS_PER_ROUND = 5;

function createRound(words: Word[]) {
  const roundWords = words
    .filter((word) => word.definition)
    .sort(() => Math.random() - 0.5)
    .slice(0, WORDS_PER_ROUND);

  const wordOrder = [...roundWords]
    .sort(() => Math.random() - 0.5)
    .map((word) => word.word);

  return { roundWords, wordOrder };
}

export function MatchDefinition() {
  const { autoskip, confetti } = useSettings();
  const { addProgressToWords, filterIncompleteWords, increaseProgress } = useProgress();
  const loadedWords = useWords();
  const words = useMemo(
    () => filterIncompleteWords(addProgressToWords(loadedWords)),
    [addProgressToWords, filterIncompleteWords, loadedWords],
  );
  const [roundWords, setRoundWords] = useState<Word[] | null>(null); // the words for this round, fixed order
  const [wordOrder, setWordOrder] = useState<string[] | null>(null); // shuffled word list for the left column
  const [matchedWords, setMatchedWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // which roundWords entry's definition is shown

  const [correctWord, setCorrectWord] = useState<string | null>(null);
  const [wrongWord, setWrongWord] = useState<string | null>(null);
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

  function handleWordClick(word: string) {
    if (!target || locked || matchedWords.includes(word)) return;

    if (word === target.word) {
      setLocked(true);
      setCorrectWord(word);
      if (confetti) celebrate();

      increaseProgress(word, target.progress);
      recordSessionResult("correct");

      setTimeout(() => {
        startTransition(() => {
          setMatchedWords((prev) => [...prev, word]);
        });
        if (autoskip) {
          setTimeout(() => {
            restartExercise();
          }, 1000);
        }
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
    startTransition(() => {
      const { roundWords: nextRoundWords, wordOrder: nextWordOrder } =
        createRound(words);
      setRoundWords(nextRoundWords);
      setWordOrder(nextWordOrder);
      setMatchedWords([]);
      setCurrentIndex(0);
    });
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
      <ViewTransition>
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
                {wordData?.word.charAt(0).toUpperCase() +
                  (wordData?.word.slice(1) ?? "")}
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
      </ViewTransition>
      <button className="restart-button" onClick={restartExercise}>
        <RefreshIcon /> {exerciseComplete ? "Next" : "Restart"}
      </button>
      {exerciseComplete && (
        <div className="completion-message">
          <h1>Well done! 🎉</h1>
          <p>You matched the definition correctly.</p>
        </div>
      )}
      <SettingsControl></SettingsControl>
    </div>
  );
}
