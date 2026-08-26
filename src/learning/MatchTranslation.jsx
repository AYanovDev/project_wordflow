import { useEffect, useState } from "react";
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

function createExercise(words) {
  const selectedWords = [...words].sort(() => Math.random() - 0.5).slice(0, 5);

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

export function MatchTranslation() {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useEffect(() => {
    if (!grade || !module) return;

    const controller = new AbortController();

    fetch(`/word_data/grade_${grade}/module_${module}.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error("Vocabulary file could not be loaded.");
        return response.json();
      })
      .then((data) => {
        setWords(data);
        setExerciseWords(createExercise(data));
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(true);
      });

    return () => controller.abort();
  }, [grade, module]);

  function evaluateMatch(englishWord, russianWord) {
    if (englishWord === russianWord) {
      setCorrectEnglish(englishWord);
      setCorrectRussian(russianWord);

      setTimeout(() => {
        setMatchedWords((prev) => [...prev, englishWord]);
        setCorrectEnglish(null);
        setCorrectRussian(null);
        setSelectedCard(null);
      }, 500);
    } else {
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
    setExerciseWords(createExercise(words));
    setMatchedWords([]);
    setSelectedCard(null);
    setCorrectEnglish(null);
    setCorrectRussian(null);
    setWrongEnglish(null);
    setWrongRussian(null);
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
        <h1>Match the translations</h1>
        <p className="instructions">
          Click or drag any word onto its matching translation.
        </p>
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
                  text={word.translation}
                  isMatched={isMatched}
                  isSelected={isSelected}
                  isCorrect={correctRussian === word.word}
                  isIncorrect={wrongRussian === word.word}
                  onClick={() => handleCardClick("russian", word.word)}
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
