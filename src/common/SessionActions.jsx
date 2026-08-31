import { useNavigate } from "react-router-dom";
import { resetSessionResults } from "./sessionResults";

export function SessionActions({ className }) {
  const navigate = useNavigate();

  function returnToVocabulary() {
    resetSessionResults();
    navigate("/learn");
  }

  return (
    <div className={className}>
      <button type="button" onClick={returnToVocabulary}>
        ← Back to vocabulary
      </button>
      <button type="button" onClick={() => navigate("/results")}>
        Show results
      </button>
    </div>
  );
}
