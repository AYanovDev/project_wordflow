import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { celebrate } from "./confetti";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import "./matchTranslation.css";
import { useLearningData } from "../common/DataContext";
import { addProgressToWords, increaseWordProgress } from "../common/wordProgress";
import { recordSessionResult } from "../common/sessionResults";
import { SessionActions } from "../common/SessionActions";
import "../common/resultsPage.css";

function createExercise(words, matchField) {
  const selectedWords = words
    .filter((word) => word[matchField])
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  return {
    english: selectedWords,
    russian: [...selectedWords].sort(() => Math.random() - 0.5),
  };
}

// Unified card component that supports both dragging and dropping
function WordCard({
  id,
  text,
  isSelected,
  isCorrect,
  isIncorrect,
  isMatched,
  onClick,
  onNodeChange,
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    disabled: isMatched,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id,
    disabled: isMatched,
  });

  // Merge refs so the DOM node acts as both draggable and droppable
  const setNodeRef = (node) => {
    setDraggableRef(node);
    setDroppableRef(node);
    onNodeChange(id, node);
  };

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isMatched ? {} : listeners)}
      {...(isMatched ? {} : attributes)}
      onClick={isMatched ? undefined : onClick}
      className={`match-card ${isMatched ? "matched" : ""} ${
        isSelected ? "selected" : ""
      } ${isOver ? "drop-target" : ""} ${isCorrect ? "correct" : ""} ${
        isIncorrect ? "incorrect" : ""
      } ${isDragging ? "dragging" : ""}`}
    >
      {text}
    </div>
  );
}

export function MatchExercise({
  matchField = "translation",
  title = "Match the translations",
  instructions = "Click or drag any word onto its matching translation.",
}) {
  const { grade, module } = useLearningData();
  const [words, setWords] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [exerciseWords, setExerciseWords] = useState(null);
  const [matchedWords, setMatchedWords] = useState([]);

  // Selection & feedback state
  const [selectedCard, setSelectedCard] = useState(null); // { type: 'english'|'russian', word: string }
  const [correctEnglish, setCorrectEnglish] = useState(null);
  const [correctRussian, setCorrectRussian] = useState(null);
  const [wrongEnglish, setWrongEnglish] = useState(null);
  const [wrongRussian, setWrongRussian] = useState(null);
  const cardNodes = useRef(new Map());
  const previousPositions = useRef(new Map());
  const layoutAnimations = useRef(new Map());
  const pendingMatches = useRef(new Set());

  function handleCardNodeChange(id, node) {
    if (node) {
      cardNodes.current.set(id, node);
    } else {
      cardNodes.current.delete(id);
    }
  }

  // Animate each card from its old position to its new one after a match moves
  // it to the top of its column (the FLIP layout-animation technique).
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextPositions = new Map();

    cardNodes.current.forEach((node, id) => {
      const nextPosition = node.getBoundingClientRect();
      const previousPosition = previousPositions.current.get(id);

      if (previousPosition && !reducedMotion) {
        const offsetX = previousPosition.left - nextPosition.left;
        const offsetY = previousPosition.top - nextPosition.top;

        if (offsetX || offsetY) {
          layoutAnimations.current.get(id)?.cancel();
          const animation = node.animate(
            [
              { transform: `translate(${offsetX}px, ${offsetY}px)` },
              { transform: "translate(0, 0)" },
            ],
            { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          );
          layoutAnimations.current.set(id, animation);
          animation.finished
            .catch(() => {})
            .then(() => {
              if (layoutAnimations.current.get(id) === animation) {
                layoutAnimations.current.delete(id);
              }
            });
        }
      }

      nextPositions.set(id, nextPosition);
    });

    previousPositions.current = nextPositions;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useEffect(() => {
    if (!grade || !module) return;

    const controller = new AbortController();
    pendingMatches.current.clear();
    setMatchedWords([]);

    fetch(`/word_data/grade_${grade}/module_${module}.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error("Vocabulary file could not be loaded.");
        return response.json();
      })
      .then((data) => {
        const wordsWithProgress = addProgressToWords(data, grade, module);
        setWords(wordsWithProgress);
        setExerciseWords(createExercise(wordsWithProgress, matchField));
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(true);
      });

    return () => controller.abort();
  }, [grade, matchField, module]);

  function evaluateMatch(englishWord, russianWord) {
    if (englishWord === russianWord) {
      if (matchedWords.includes(englishWord) || pendingMatches.current.has(englishWord)) {
        return;
      }

      pendingMatches.current.add(englishWord);
      const word = words?.find((item) => item.word === englishWord);
      const nextProgress = increaseWordProgress(
        grade,
        module,
        englishWord,
        word?.progress,
      );

      setWords((previousWords) =>
        previousWords?.map((item) =>
          item.word === englishWord ? { ...item, progress: nextProgress } : item,
        ),
      );
      setCorrectEnglish(englishWord);
      setCorrectRussian(russianWord);
      recordSessionResult("correct");

      setTimeout(() => {
        setMatchedWords((prev) => [...prev, englishWord]);
        pendingMatches.current.delete(englishWord);
        setCorrectEnglish(null);
        setCorrectRussian(null);
        setSelectedCard(null);
      }, 500);
    } else {
      recordSessionResult("incorrect");
      setWrongEnglish(englishWord);
      setWrongRussian(russianWord);

      setTimeout(() => {
        setWrongEnglish(null);
        setWrongRussian(null);
        setSelectedCard(null);
      }, 500);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!active || !over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let englishWord = null;
    let russianWord = null;

    // Determine direction of drag (English -> Russian or Russian -> English)
    if (activeId.startsWith("english-") && overId.startsWith("russian-")) {
      englishWord = activeId.replace("english-", "");
      russianWord = overId.replace("russian-", "");
    } else if (
      activeId.startsWith("russian-") &&
      overId.startsWith("english-")
    ) {
      russianWord = activeId.replace("russian-", "");
      englishWord = overId.replace("english-", "");
    } else {
      // Dragged onto an item in the same column
      return;
    }

    evaluateMatch(englishWord, russianWord);
  }

  function handleCardClick(type, word) {
    // Select first card
    if (!selectedCard) {
      setSelectedCard({ type, word });
      return;
    }

    // Toggle off if clicking the same card again
    if (selectedCard.type === type && selectedCard.word === word) {
      setSelectedCard(null);
      return;
    }

    // Switch selection if clicking another card in the same column
    if (selectedCard.type === type) {
      setSelectedCard({ type, word });
      return;
    }

    // Trigger match check if clicking card in the opposite column
    const englishWord = type === "english" ? word : selectedCard.word;
    const russianWord = type === "russian" ? word : selectedCard.word;

    evaluateMatch(englishWord, russianWord);
  }

  function restartExercise() {
    setExerciseWords(createExercise(words, matchField));
    setMatchedWords([]);
    setSelectedCard(null);
    setCorrectEnglish(null);
    setCorrectRussian(null);
    setWrongEnglish(null);
    setWrongRussian(null);
    pendingMatches.current.clear();
  }

  if (!grade || !module) {
    return <Navigate to="/quest" replace />;
  }

  if (loadError) {
    return <p role="alert">We couldn't load this vocabulary module yet.</p>;
  }

  if (!exerciseWords) {
    return <p className="match-container">Loading exercise…</p>;
  }

  // Keep matched words sorted at the top
  const matchedEnglish = matchedWords.map((mw) =>
    exerciseWords.english.find((w) => w.word === mw),
  );
  const remainingEnglish = exerciseWords.english.filter(
    (w) => !matchedWords.includes(w.word),
  );
  const sortedEnglish = [...matchedEnglish, ...remainingEnglish];

  const matchedRussian = matchedWords.map((mw) =>
    exerciseWords.russian.find((w) => w.word === mw),
  );
  const remainingRussian = exerciseWords.russian.filter(
    (w) => !matchedWords.includes(w.word),
  );
  const sortedRussian = [...matchedRussian, ...remainingRussian];

  const exerciseComplete = matchedWords.length === exerciseWords.english.length;

  if (exerciseComplete) {
    celebrate();
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="match-container">
        <SessionActions className="session-actions" />
        <h1>{title}</h1>
        <p className="instructions">{instructions}</p>
        <div className="matching-columns">
          {/* ENGLISH COLUMN */}
          <div className="matching-column">
            {sortedEnglish.map((word) => {
              const isMatched = matchedWords.includes(word.word);
              const isSelected =
                selectedCard?.type === "english" &&
                selectedCard?.word === word.word;

              return (
                <WordCard
                  key={`english-${word.word}`}
                  id={`english-${word.word}`}
                  text={word.word.charAt(0).toUpperCase() + word.word.slice(1)}
                  isMatched={isMatched}
                  isSelected={isSelected}
                  isCorrect={correctEnglish === word.word}
                  isIncorrect={wrongEnglish === word.word}
                  onClick={() => handleCardClick("english", word.word)}
                  onNodeChange={handleCardNodeChange}
                />
              );
            })}
          </div>

          {/* RUSSIAN COLUMN */}
          <div className="matching-column">
            {sortedRussian.map((word) => {
              const isMatched = matchedWords.includes(word.word);
              const isSelected =
                selectedCard?.type === "russian" &&
                selectedCard?.word === word.word;

              return (
                <WordCard
                  key={`russian-${word.word}`}
                  id={`russian-${word.word}`}
                  text={word[matchField]}
                  isMatched={isMatched}
                  isSelected={isSelected}
                  isCorrect={correctRussian === word.word}
                  isIncorrect={wrongRussian === word.word}
                  onClick={() => handleCardClick("russian", word.word)}
                  onNodeChange={handleCardNodeChange}
                />
              );
            })}
          </div>
        </div>
        {exerciseComplete && (
          <div className="completion-message">
            <h1>Well done! 🎉</h1>
            <p>You matched all the words correctly.</p>
          </div>
        )}
        <button className="restart-button" onClick={restartExercise}>
          {exerciseComplete ? "Try again" : "Restart"}
        </button>
      </div>
    </DndContext>
  );
}

export function MatchTranslation() {
  return <MatchExercise />;
}
