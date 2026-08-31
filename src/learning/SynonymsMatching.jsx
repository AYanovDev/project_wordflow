import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { celebrate } from "./confetti";
import { useLearningData } from "../common/DataContext";
import { addProgressToWords, increaseWordProgress } from "../common/wordProgress";
import { recordSessionResult } from "../common/sessionResults";
import { SessionActions } from "../common/SessionActions";
import "./synonymsMatching.css";
import "../common/resultsPage.css";

const PAIR_COUNT = 5;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createExercise(words) {
  const usedSynonyms = new Set();
  const pairs = [];

  for (const word of shuffle(words)) {
    if (!Array.isArray(word.synonyms) || word.synonyms.length === 0) continue;

    const synonym = shuffle(word.synonyms).find(
      (item) => item && !usedSynonyms.has(item.trim().toLowerCase()),
    );

    if (!synonym) continue;

    usedSynonyms.add(synonym.trim().toLowerCase());
    pairs.push({ id: `${word.word}-${synonym}`, word: word.word, synonym });

    if (pairs.length === PAIR_COUNT) break;
  }

  return {
    words: pairs,
    synonyms: shuffle(pairs),
  };
}

function MatchingCard({
  id,
  text,
  isMatched,
  isSelected,
  feedback,
  onClick,
  onNodeChange,
}) {
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } =
    useDraggable({ id, disabled: isMatched });
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id,
    disabled: isMatched,
  });

  const setNodeRef = (node) => {
    setDraggableRef(node);
    setDroppableRef(node);
    onNodeChange(id, node);
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      className={`synonym-card ${isMatched ? "matched" : ""} ${
        isSelected ? "selected" : ""
      } ${feedback || ""} ${isOver ? "drop-target" : ""} ${
        isDragging ? "dragging" : ""
      }`}
      disabled={isMatched}
      onClick={onClick}
      {...(isMatched ? {} : listeners)}
      {...(isMatched ? {} : attributes)}
    >
      {text}
    </button>
  );
}

export function SynonymsMatching() {
  const { grade, module } = useLearningData();
  const [words, setWords] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimer = useRef(null);
  const celebrated = useRef(false);
  const cardNodes = useRef(new Map());
  const previousPositions = useRef(new Map());
  const layoutAnimations = useRef(new Map());

  function handleCardNodeChange(id, node) {
    if (node) {
      cardNodes.current.set(id, node);
    } else {
      cardNodes.current.delete(id);
    }
  }

  // Move cards smoothly into their new matched-first positions.
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    if (!grade || !module) return;

    const controller = new AbortController();
    setLoadError(false);
    setExercise(null);
    setMatchedIds([]);
    celebrated.current = false;

    fetch(`/word_data/grade_${grade}/module_${module}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Vocabulary file could not be loaded.");
        return response.json();
      })
      .then((data) => {
        const wordsWithProgress = addProgressToWords(data, grade, module);
        setWords(wordsWithProgress);
        setExercise(createExercise(wordsWithProgress));
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(true);
      });

    return () => {
      controller.abort();
      clearTimeout(feedbackTimer.current);
    };
  }, [grade, module]);

  const complete = exercise && exercise.words.length > 0 && matchedIds.length === exercise.words.length;

  useEffect(() => {
    if (complete && !celebrated.current) {
      celebrate();
      celebrated.current = true;
    }
  }, [complete]);

  function checkMatch(wordId, synonymId) {
    if (feedback) return;

    if (wordId !== synonymId || matchedIds.includes(wordId)) {
      recordSessionResult("incorrect");
      setFeedback({ wordId, synonymId, type: "incorrect" });
    } else {
      const pair = exercise.words.find((item) => item.id === wordId);
      const sourceWord = words.find((item) => item.word === pair.word);
      const nextProgress = increaseWordProgress(
        grade,
        module,
        pair.word,
        sourceWord?.progress,
      );

      setWords((currentWords) =>
        currentWords.map((item) =>
          item.word === pair.word ? { ...item, progress: nextProgress } : item,
        ),
      );
      recordSessionResult("correct");
      setFeedback({ wordId, synonymId, type: "correct" });
    }

    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      if (wordId === synonymId) setMatchedIds((current) => [...current, wordId]);
      setFeedback(null);
      setSelectedCard(null);
    }, 500);
  }

  function handleCardClick(side, id) {
    if (!selectedCard) {
      setSelectedCard({ side, id });
      return;
    }

    if (selectedCard.side === side) {
      setSelectedCard(selectedCard.id === id ? null : { side, id });
      return;
    }

    checkMatch(side === "word" ? id : selectedCard.id, side === "synonym" ? id : selectedCard.id);
  }

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const [activeSide, activeId] = String(active.id).split(":");
    const [overSide, overId] = String(over.id).split(":");
    if (activeSide === overSide) return;
    checkMatch(activeSide === "word" ? activeId : overId, activeSide === "synonym" ? activeId : overId);
  }

  function restartExercise() {
    setExercise(createExercise(words));
    setMatchedIds([]);
    setSelectedCard(null);
    setFeedback(null);
    celebrated.current = false;
  }

  if (!grade || !module) return <Navigate to="/quest" replace />;
  if (loadError) return <p role="alert">We couldn't load this vocabulary module yet.</p>;
  if (!exercise) return <p className="synonyms-container">Loading exercise…</p>;

  if (exercise.words.length === 0) {
    return (
      <main className="synonyms-container synonyms-empty">
        <SessionActions className="session-actions" />
        <h1>Match synonyms</h1>
        <p>This module does not contain words with synonyms yet.</p>
      </main>
    );
  }

  const matchedPairs = matchedIds
    .map((id) => exercise.words.find((pair) => pair.id === id))
    .filter(Boolean);
  const unmatchedWords = exercise.words.filter((pair) => !matchedIds.includes(pair.id));
  const unmatchedSynonyms = exercise.synonyms.filter(
    (pair) => !matchedIds.includes(pair.id),
  );
  const sortedWords = [...matchedPairs, ...unmatchedWords];
  const sortedSynonyms = [...matchedPairs, ...unmatchedSynonyms];

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="synonyms-container">
        <SessionActions className="session-actions" />
        <h1>Match synonyms</h1>
        <p className="synonyms-instructions">Click or drag each word onto its synonym.</p>
        <div className="synonyms-columns">
          <section className="synonyms-column" aria-label="Words">
            {sortedWords.map((pair) => (
              <MatchingCard
                key={`word:${pair.id}`}
                id={`word:${pair.id}`}
                text={pair.word}
                isMatched={matchedIds.includes(pair.id)}
                isSelected={selectedCard?.side === "word" && selectedCard.id === pair.id}
                feedback={feedback?.wordId === pair.id ? feedback.type : ""}
                onClick={() => handleCardClick("word", pair.id)}
                onNodeChange={handleCardNodeChange}
              />
            ))}
          </section>
          <section className="synonyms-column" aria-label="Synonyms">
            {sortedSynonyms.map((pair) => (
              <MatchingCard
                key={`synonym:${pair.id}`}
                id={`synonym:${pair.id}`}
                text={pair.synonym}
                isMatched={matchedIds.includes(pair.id)}
                isSelected={selectedCard?.side === "synonym" && selectedCard.id === pair.id}
                feedback={feedback?.synonymId === pair.id ? feedback.type : ""}
                onClick={() => handleCardClick("synonym", pair.id)}
                onNodeChange={handleCardNodeChange}
              />
            ))}
          </section>
        </div>
        {complete && <p className="synonyms-complete">Well done! You matched every synonym. 🎉</p>}
        <button className="synonyms-restart-button" onClick={restartExercise}>
          {complete ? "Try again" : "Restart"}
        </button>
      </main>
    </DndContext>
  );
}
