import { Routes, Route } from "react-router-dom";

import { WordCards } from "./presentation/WordCards.jsx";
import { MatchTranslation } from "./learning/MatchTranslation.jsx";
import { Welcome } from "./welcome/Welcome.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />

      <Route path="/learn" element={<WordCards />} />
    </Routes>
  );
}

export default App;
