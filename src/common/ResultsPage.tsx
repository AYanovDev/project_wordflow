import { useNavigate } from "react-router-dom";
import { getSessionResults, resetSessionResults } from "./sessionResults";
import "./resultsPage.css";

export function ResultsPage() {
  const navigate = useNavigate();
  const { correct, incorrect } = getSessionResults();

  function returnToVocabulary() {
    resetSessionResults();
    navigate("/learn");
  }

  return (
    <main className="results-page">
      <section className="results-card" aria-labelledby="results-title">
        <p className="results-eyebrow">Current session</p>
        <h1 id="results-title">Your results</h1>
        <div className="results-summary">
          <p className="result-total result-correct"><span>Correct matches</span><strong>{correct}</strong></p>
          <p className="result-total result-incorrect"><span>Incorrect matches</span><strong>{incorrect}</strong></p>
        </div>
        <div className="results-actions">
          <button type="button" onClick={() => navigate(-1)}>← Back to exercise</button>
          <button type="button" onClick={returnToVocabulary}>Back to vocabulary</button>
        </div>
      </section>
    </main>
  );
}
