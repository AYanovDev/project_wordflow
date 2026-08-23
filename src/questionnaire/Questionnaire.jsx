import { useEffect, useState } from "react";
import "./questionnaire.css";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "learningPreferences";
const grades = [7, 8, 9, 10, 11];
const modules = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Questionnaire() {
  const [grade, setGrade] = useState("");
  const [module, setModule] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);

    if (!savedPreferences) {
      return;
    }

    try {
      const { grade: savedGrade, module: savedModule } =
        JSON.parse(savedPreferences);
      setGrade(String(savedGrade));
      setModule(String(savedModule));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    if (!grade || !module) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        grade: Number(grade),
        module: Number(module),
      }),
    );

    setIsSaved(true);
    navigate("/learn");
  }

  function handleChange(setValue) {
    return (event) => {
      setValue(event.target.value);
      setIsSaved(false);
    };
  }

  return (
    <main className="questionnaire-page">
      <section
        className="questionnaire-card"
        aria-labelledby="questionnaire-title"
      >
        <p className="questionnaire-label">Set up your learning path</p>
        <h1 id="questionnaire-title">What are you learning now?</h1>
        <p className="questionnaire-description">
          Tell us your grade and current module so we can prepare vocabulary
          that matches your lessons.
        </p>

        <form className="questionnaire-form" onSubmit={handleSubmit}>
          <label htmlFor="grade">Your grade</label>
          <select
            id="grade"
            value={grade}
            onChange={handleChange(setGrade)}
            required
          >
            <option value="" disabled>
              Choose your grade
            </option>
            {grades.map((gradeOption) => (
              <option key={gradeOption} value={gradeOption}>
                Grade {gradeOption}
              </option>
            ))}
          </select>

          <label htmlFor="module">Current module</label>
          <select
            id="module"
            value={module}
            onChange={handleChange(setModule)}
            required
          >
            <option value="" disabled>
              Choose your module
            </option>
            {modules.map((moduleOption) => (
              <option key={moduleOption} value={moduleOption}>
                Module {moduleOption}
              </option>
            ))}
          </select>

          <button type="submit">Save preferences</button>

          {isSaved && (
            <p className="questionnaire-success" role="status">
              Saved! Your vocabulary will be tailored to Grade {grade}, Module{" "}
              {module}.
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
