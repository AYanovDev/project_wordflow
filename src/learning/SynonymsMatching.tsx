import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from "react";
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
import { recordSessionResult } from "../common/sessionResults";
import { SessionActions } from "../common/SessionActions";
import "./synonymsMatching.css";
import "../common/resultsPage.css";
import type { FeedbackType, Word } from "../types";
import { useWords } from "../common/contexts/WordLoader";
import { RefreshIcon } from "../icons/RefreshIcon";
import { SettingsControl } from "../common/settings/SettingsControl";
import { useSettings } from "../common/settings/SettingsContext";
import { useProgress } from "../common/contexts/ProgressContext";

const PAIR_COUNT = 5;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

type SynonymPair = { id: string; word: string; synonym: string };
type Exercise = { words: SynonymPair[]; synonyms: SynonymPair[] };
type SelectedCard = { side: "word" | "synonym"; id: string };
type Feedback = { wordId: string; synonymId: string; type: FeedbackType };

function createExercise(words: Word[]): Exercise {
  const usedSynonyms = new Set();
  const pairs: SynonymPair[] = [];

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
  const { autoskip, confetti } = useSettings();
  const loadedWords = useWords();
  const { addProgressToWords, filterIncompleteWords } = useProgress();
  const words = useMemo(
    () => filterIncompleteWords(addProgressToWords(loadedWords)),
    [addProgressToWords, filterIncompleteWords, loadedWords],
  );
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
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
    setExercise(createExercise(words));
    setMatchedIds([]);
    setSelectedCard(null);
    setFeedback(null);
    celebrated.current = false;
  }, [words]);

  const complete =
    exercise &&
    exercise.words.length > 0 &&
    matchedIds.length === exercise.words.length;

  useEffect(() => {
    if (complete && !celebrated.current) {
      celebrated.current = true;
    }
  }, [complete]);

  function checkMatch(wordId, synonymId) {
    if (feedback) return;

    if (wordId !== synonymId || matchedIds.includes(wordId)) {
      recordSessionResult("incorrect");
      setFeedback({ wordId, synonymId, type: "incorrect" });
    } else {
      recordSessionResult("correct");
      setFeedback({ wordId, synonymId, type: "correct" });
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
      if (wordId === synonymId) {
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
      side === "synonym" ? id : selectedCard.id,
    );
  }

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const [activeSide, activeId] = String(active.id).split(":");
    const [overSide, overId] = String(over.id).split(":");
    if (activeSide === overSide) return;
    checkMatch(
      activeSide === "word" ? activeId : overId,
      activeSide === "synonym" ? activeId : overId,
    );
  }

  function restartExercise() {
    startTransition(() => {
      setExercise(createExercise(words));
      setMatchedIds([]);
      setSelectedCard(null);
      setFeedback(null);
    });
    celebrated.current = false;
  }

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
  const unmatchedWords = exercise.words.filter(
    (pair) => !matchedIds.includes(pair.id),
  );
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
        <p className="synonyms-instructions">
          Click or drag each word onto its synonym.
        </p>
        <ViewTransition>
          <div className="synonyms-columns">
          <section className="synonyms-column" aria-label="Words">
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
          <section className="synonyms-column" aria-label="Synonyms">
            {sortedSynonyms.map((pair) => (
              <MatchingCard
                key={`synonym:${pair.id}`}
                id={`synonym:${pair.id}`}
                text={pair.synonym}
                isMatched={matchedIds.includes(pair.id)}
                isSelected={
                  selectedCard?.side === "synonym" &&
                  selectedCard.id === pair.id
                }
                feedback={feedback?.synonymId === pair.id ? feedback.type : ""}
                onClick={() => handleCardClick("synonym", pair.id)}
                onNodeChange={handleCardNodeChange}
              />
            ))}
          </section>
          </div>
        </ViewTransition>
        {complete && (
          <p className="synonyms-complete">
            Well done! You matched every synonym. 🎉
          </p>
        )}
        <button className="synonyms-restart-button" onClick={restartExercise}>
          <RefreshIcon /> {complete ? "Try again" : "Restart"}
        </button>
        <SettingsControl></SettingsControl>
      </main>
    </DndContext>
  );
}
