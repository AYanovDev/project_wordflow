import { Routes, Route } from "react-router-dom";
import { WordCards } from "./presentation/WordCards.jsx";
import { MatchTranslation } from "./learning/MatchTranslation.jsx";
import { Welcome } from "./welcome/Welcome.jsx";
import { Questionnaire } from "./questionnaire/Questionnaire.jsx";
import { WordLoader } from "./common/WordLoader.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/quest" element={<Questionnaire />} />
      <Route path="/learn" element={<WordLoader />} />
    </Routes>
  );
}

export default App;
