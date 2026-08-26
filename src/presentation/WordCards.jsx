import { useState } from "react";
import "./wordCards.css";
import { useLearningData } from "../common/DataContext";

export function WordCards({ words }) {
  const { grade, module } = useLearningData();
  const [currentIndex, setCurrentIndex] = useState(null);
  const [showEnglish, setShowEnglish] = useState(true);

  // Get the currently selected word
  const singleCard = currentIndex !== null ? words[currentIndex] : null;

  // Move to previous word
  function previousWord() {
    if (currentIndex > 0) {
      setCurrentIndex((previous) => previous - 1);
      setShowEnglish(true);
    }
  }

  // Move to next word
  function nextWord() {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((previous) => previous + 1);
      setShowEnglish(true);
    }
  }

  // Single-card mode
  if (singleCard) {
    return (
      <div className="single-card-container">
        <button
          className="navigation-button"
          onClick={previousWord}
          disabled={currentIndex === 0}
        >
          ←
        </button>

        <div
          className="single-card"
          onClick={() => setShowEnglish((previous) => !previous)}
        >
          {showEnglish ? (
            <>
              <h2>
                {singleCard.word.charAt(0).toUpperCase() +
                  singleCard.word.slice(1)}
              </h2>

              <p>{singleCard.partOfSpeech}</p>
            </>
          ) : (
            <h2>{singleCard.translation}</h2>
          )}
        </div>

        <button
          className="navigation-button"
          onClick={nextWord}
          disabled={currentIndex === words.length - 1}
        >
          →
        </button>

        <button
          className="back-button"
          onClick={() => {
            setCurrentIndex(null);
            setShowEnglish(true);
          }}
        >
          Back
        </button>
      </div>
    );
  }

  // Word list
  return (
    <section className="word-list-section">
      <header className="word-list-header">
        <p>Grade {grade} · Module {module}</p>
        <h1>Vocabulary</h1>
      </header>
      <div className="word-list">
      {words.map((word, index) => (
        <div
          className="word-card"
          key={word.word}
          onClick={() => {
            setCurrentIndex(index);
            setShowEnglish(true);
          }}
        >
          <h2>{word.word.charAt(0).toUpperCase() + word.word.slice(1)}</h2>

          <p>{word.partOfSpeech}</p>
        </div>
      ))}
      </div>
    </section>
  );
}
