import { useProgress } from "../common/contexts/ProgressContext";
import { useWords } from "../common/contexts/WordLoader";

export function TotalStats() {
  const words = useWords();

  return (
    <div>
      <div className="progress_bar"></div>
      <div>
        <p>Total progress: {progress}%</p>
        <p>
          Words learned: {totalLearned}/{total}
        </p>
      </div>
    </div>
  );
}
