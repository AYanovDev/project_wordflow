import { useState } from "react";
import words from "../assets/grade_8_module_1.json";
import "./presentation.css";

export function WordCards() {
  const [singleCard, setSingleCard] = useState(null);
  const [showEnglish, setShowEnglish] = useState(true);

  // Flashcard mode
  if (singleCard) {
    return (
      <div className="single-card-container">
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
          onClick={() => {
            setSingleCard(null);
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
    <div className="word-list">
      {words.map((word) => (
        <div
          className="word-card"
          key={word.word}
          onClick={() => {
            setSingleCard(word);
            setShowEnglish(true);
          }}
        >
          <h2>{word.word.charAt(0).toUpperCase() + word.word.slice(1)}</h2>

          <p>{word.partOfSpeech}</p>
        </div>
      ))}
    </div>
  );
}
