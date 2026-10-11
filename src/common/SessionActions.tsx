import { useNavigate } from "react-router-dom";
import { resetSessionResults } from "./sessionResults";
import { ListIcon } from "../icons/ListIcon";

export function SessionActions({ className }: { className?: string }) {
  const navigate = useNavigate();

  function returnToVocabulary() {
    resetSessionResults();
    navigate("/learn");
  }

  return (
    <div className={className}>
      <button type="button" onClick={returnToVocabulary}>
        <ListIcon /> Back to vocabulary
      </button>
      <button type="button" onClick={() => navigate("/results")}>
        Show results
      </button>
    </div>
  );
}
