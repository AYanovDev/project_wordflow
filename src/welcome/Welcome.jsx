import { Link } from "react-router-dom";
import "./welcome.css";

export function Welcome() {
  return (
    <main className="welcome-page">
      <section className="welcome-content">
        <p className="welcome-label">Learn. Practice. Remember.</p>

        <h1 className="welcome-title">Wordflow</h1>

        <p className="welcome-description">
          Wordflow is a simple vocabulary learning tool designed to help you
          practice English words through interactive exercises.
        </p>

        <p className="welcome-description welcome-description-secondary">
          Explore new vocabulary, test your knowledge, and strengthen your
          memory by learning through practice.
        </p>

        <Link to="/quest" className="welcome-button">
          Start learning
          <span className="welcome-arrow">→</span>
        </Link>
      </section>

      <div className="welcome-decoration welcome-decoration-one" />
      <div className="welcome-decoration welcome-decoration-two" />
    </main>
  );
}
