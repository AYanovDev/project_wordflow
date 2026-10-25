import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
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
import { useLearningData } from "../common/contexts/DataContext";
import { useProgress } from "../common/contexts/ProgressContext";
import { recordSessionResult } from "../common/sessionResults";
import { SessionActions } from "../common/SessionActions";
import "./antonymMatching.css";
import "../common/resultsPage.css";
import type { FeedbackType, Word } from "../types";
import { RefreshIcon } from "../icons/RefreshIcon";
import { SettingsControl } from "../common/settings/SettingsControl";
import { useSettings } from "../common/settings/SettingsContext";

const PAIR_COUNT = 5;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

type AntonymPair = { id: string; word: string; antonym: string };
type Exercise = { words: AntonymPair[]; antonyms: AntonymPair[] };
type SelectedCard = { side: "word" | "antonym"; id: string };
type Feedback = { wordId: string; antonymId: string; type: FeedbackType };

function createExercise(words: Word[]): Exercise {
  const usedAntonyms = new Set();
  const pairs: AntonymPair[] = [];

  for (const word of shuffle(words)) {
    if (!Array.isArray(word.antonyms) || word.antonyms.length === 0) continue;

    const antonym = shuffle(word.antonyms).find(
      (item) =>
        typeof item === "string" &&
        item.trim() &&
        !usedAntonyms.has(item.trim().toLowerCase()),
    );

    if (!antonym) continue;

    usedAntonyms.add(antonym.trim().toLowerCase());
    pairs.push({ id: `${word.word}-${antonym}`, word: word.word, antonym });

    if (pairs.length === PAIR_COUNT) break;
  }

  return {
    words: pairs,
    antonyms: shuffle(pairs),
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
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({ id, disabled: isMatched });
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
      style={
        transform ? { transform: CSS.Translate.toString(transform) } : undefined
      }
      className={`antonym-card ${isMatched ? "matched" : ""} ${
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

export function AntonymMatching() {
  const { grade, module } = useLearningData();
  const { filterIncompleteWords } = useProgress();
  const { autoskip, confetti } = useSettings();
  const [words, setWords] = useState<Word[] | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackTimer = useRef(null);
  const cardNodes = useRef(new Map());
  const previousPositions = useRef(new Map());
  const layoutAnimations = useRef(new Map());

  function handleCardNodeChange(id, node) {
    if (node) cardNodes.current.set(id, node);
    else cardNodes.current.delete(id);
  }

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
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

    fetch(`/word_data/grade_${grade}/module_${module}.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error("Vocabulary file could not be loaded.");
        return response.json() as Promise<Word[]>;
      })
      .then((data) => {
        const incompleteWords = filterIncompleteWords(data);
        setWords(incompleteWords);
        setExercise(createExercise(incompleteWords));
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(true);
      });

    return () => {
      controller.abort();
      clearTimeout(feedbackTimer.current);
    };
  }, [filterIncompleteWords, grade, module]);

  const complete =
    exercise &&
    exercise.words.length > 0 &&
    matchedIds.length === exercise.words.length;

  function checkMatch(wordId, antonymId) {
    if (feedback) return;

    if (wordId !== antonymId || matchedIds.includes(wordId)) {
      recordSessionResult("incorrect");
      setFeedback({ wordId, antonymId, type: "incorrect" });
    } else {
      recordSessionResult("correct");
      setFeedback({ wordId, antonymId, type: "correct" });
      if (matchedIds.length + 1 === exercise.words.length && confetti) {
        celebrate();
      }
      if (matchedIds.length + 1 === exercise.words.length && autoskip) {
        setTimeout(() => {
          restartExercise();
        }, 1000);
      }
    }

    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      if (wordId === antonymId) {
        startTransition(() => {
          setMatchedIds((current) => [...current, wordId]);
        });
      }
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

    checkMatch(
      side === "word" ? id : selectedCard.id,
      side === "antonym" ? id : selectedCard.id,
    );
  }

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const [activeSide, activeId] = String(active.id).split(":");
    const [overSide, overId] = String(over.id).split(":");
    if (activeSide === overSide) return;
    checkMatch(
      activeSide === "word" ? activeId : overId,
      activeSide === "antonym" ? activeId : overId,
    );
  }

  function restartExercise() {
    startTransition(() => {
      if (words) setExercise(createExercise(words));
      setMatchedIds([]);
      setSelectedCard(null);
      setFeedback(null);
    });
  }

  if (!grade || !module) return <Navigate to="/quest" replace />;
  if (loadError)
    return <p role="alert">We couldn't load this vocabulary module yet.</p>;
  if (!exercise) return <p className="antonyms-container">Loading exercise…</p>;

  if (exercise.words.length === 0) {
    return (
      <main className="antonyms-container antonyms-empty">
        <SessionActions className="session-actions" />
        <h1>Match antonyms</h1>
        <p>This module does not contain words with antonyms yet.</p>
      </main>
    );
  }

  const matchedPairs = matchedIds
    .map((id) => exercise.words.find((pair) => pair.id === id))
    .filter(Boolean);
  const unmatchedWords = exercise.words.filter(
    (pair) => !matchedIds.includes(pair.id),
  );
  const unmatchedAntonyms = exercise.antonyms.filter(
    (pair) => !matchedIds.includes(pair.id),
  );
  const sortedWords = [...matchedPairs, ...unmatchedWords];
  const sortedAntonyms = [...matchedPairs, ...unmatchedAntonyms];

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="antonyms-container">
        <SessionActions className="session-actions" />
        <h1>Match antonyms</h1>
        <p className="antonyms-instructions">
          Click or drag each word onto its antonym.
        </p>
        <ViewTransition>
          <div className="antonyms-columns">
          <section className="antonyms-column" aria-label="Words">
            {sortedWords.map((pair) => (
              <MatchingCard
                key={`word:${pair.id}`}
                id={`word:${pair.id}`}
                text={pair.word}
                isMatched={matchedIds.includes(pair.id)}
                isSelected={
                  selectedCard?.side === "word" && selectedCard.id === pair.id
                }
                feedback={feedback?.wordId === pair.id ? feedback.type : ""}
                onClick={() => handleCardClick("word", pair.id)}
                onNodeChange={handleCardNodeChange}
              />
            ))}
          </section>
          <section className="antonyms-column" aria-label="Antonyms">
            {sortedAntonyms.map((pair) => (
              <MatchingCard
                key={`antonym:${pair.id}`}
                id={`antonym:${pair.id}`}
                text={pair.antonym}
                isMatched={matchedIds.includes(pair.id)}
                isSelected={
                  selectedCard?.side === "antonym" &&
                  selectedCard.id === pair.id
                }
                feedback={feedback?.antonymId === pair.id ? feedback.type : ""}
                onClick={() => handleCardClick("antonym", pair.id)}
                onNodeChange={handleCardNodeChange}
              />
            ))}
          </section>
          </div>
        </ViewTransition>
        {complete && (
          <p className="antonyms-complete">
            Well done! You matched every antonym. 🎉
          </p>
        )}
        <button className="antonyms-restart-button" onClick={restartExercise}>
          <RefreshIcon /> {complete ? ` Try again` : "Restart"}
        </button>
        <SettingsControl></SettingsControl>
      </main>
    </DndContext>
  );
}
