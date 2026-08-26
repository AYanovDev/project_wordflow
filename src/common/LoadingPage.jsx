import "./loadingPage.css";

export function LoadingPage({ grade, module }) {
  return (
    <main className="loading-page" aria-busy="true" aria-live="polite">
      <section className="loading-card">
        <div className="loading-wordmark" aria-hidden="true">
          <span>W</span>
          <span>O</span>
          <span>R</span>
          <span>D</span>
        </div>
        <div className="loading-spinner" aria-hidden="true" />
        <h1>Preparing your words</h1>
        <p>
          Loading vocabulary for Grade {grade}, Module {module}.
        </p>
      </section>
    </main>
  );
}
