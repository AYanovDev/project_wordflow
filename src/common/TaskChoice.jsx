import { Navigate, useNavigate } from "react-router-dom";
import { useLearningData } from "./DataContext";
import { resetSessionResults } from "./sessionResults";
import "./taskChoice.css";

export function TaskChoice() {
  const { grade, module } = useLearningData();
  const navigate = useNavigate();

  if (!grade || !module) {
    return <Navigate to="/quest" replace />;
  }

  function startExercise(path) {
    resetSessionResults();
    navigate(path);
  }

  return (
    <main className="task-choice-page">
      <section
        className="task-choice-content"
        aria-labelledby="task-choice-title"
      >
        <p>
          Grade {grade} · Module {module}
        </p>
        <h1 id="task-choice-title">Choose an exercise</h1>
        <div className="task-choise-container">
          <button onClick={() => startExercise("/tasks/match-translation")}>
            Match translations
          </button>
          <button onClick={() => startExercise("/tasks/match-definition")}>
            Match definitions
          </button>
          <button onClick={() => startExercise("/tasks/match-synonyms")}>
            Match synonyms
          </button>
          <button onClick={() => startExercise("/tasks/match-antonyms")}>
            Match antonyms
          </button>
        </div>
      </section>
    </main>
  );
}
