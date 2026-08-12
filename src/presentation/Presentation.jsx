import words from "../assets/grade_8_module_1.json";
import "./presentation.css";

export function WordCards() {
  return (
    <div className="word-list">
      {words.map((word) => (
        <div className="word-card" key={word.word}>
          <h2>{word.word.charAt(0).toUpperCase() + word.word.slice(1)}</h2>
          <p>{word.partOfSpeech}</p>
        </div>
      ))}
    </div>
  );
}
