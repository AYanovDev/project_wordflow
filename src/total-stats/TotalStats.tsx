import { useProgress } from "../common/contexts/ProgressContext";
import { useWords } from "../common/contexts/WordLoader";
import { useLearningData } from "../common/contexts/DataContext";
import { WORD_PROGRESS_STEPS } from "../common/wordProgress";
import { useNavigate } from "react-router-dom";
import "./totalStats.css";

export function TotalStats() {
  const loadedWords = useWords();
  const { addProgressToWords } = useProgress();
  const { grade, module } = useLearningData();
  const navigate = useNavigate();
  const words = addProgressToWords(loadedWords);
  const total = words.length;
  const learned = words.filter((word) => word.progress === WORD_PROGRESS_STEPS).length;
  const unlearned = total - learned;
  const progress = total === 0 ? 0 : Math.round((learned / total) * 100);

  return (
    <main className="total-stats-page">
      <section className="total-stats-card" aria-labelledby="total-stats-title">
        <button className="total-stats-back" onClick={() => navigate("/learn")}>
          <span aria-hidden="true">←</span> Back to vocabulary
        </button>
        <p className="total-stats-eyebrow">Grade {grade} · Module {module}</p>
        <h1 id="total-stats-title">Your total progress</h1>

        <div
          className="total-progress-track"
          role="progressbar"
          aria-label="Words fully memorized"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="total-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="total-progress-percent">{progress}% complete</p>

        <div className="total-stats-summary" aria-live="polite">
          <p className="total-stat total-stat-learned">
            <span>Words learned</span>
            <strong>{learned}</strong>
          </p>
          <p className="total-stat total-stat-unlearned">
            <span>Still learning</span>
            <strong>{unlearned}</strong>
          </p>
        </div>
        <p className="total-stats-note">
          A word is learned when it reaches all {WORD_PROGRESS_STEPS} memorization steps.
        </p>
      </section>
    </main>
  );
}
