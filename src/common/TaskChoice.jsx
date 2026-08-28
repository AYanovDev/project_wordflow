import { Navigate, useNavigate } from "react-router-dom";
import { useLearningData } from "./DataContext";
import "./taskChoice.css";

export function TaskChoice() {
  const { grade, module } = useLearningData();
  const navigate = useNavigate();

  if (!grade || !module) {
    return <Navigate to="/quest" replace />;
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
          <button onClick={() => navigate("/tasks/match-translation")}>
            Match translations
          </button>
          <button onClick={() => navigate("/tasks/match-definition")}>
            Match definitions
          </button>
          <button onClick={() => navigate("/tasks/match-synonyms")}>
            Match synonyms
          </button>
        </div>
      </section>
    </main>
  );
}
