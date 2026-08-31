import { Routes, Route } from "react-router-dom";
import { Welcome } from "./welcome/Welcome.jsx";
import { Questionnaire } from "./questionnaire/Questionnaire.jsx";
import { WordLoader } from "./common/WordLoader.jsx";
import { TaskChoice } from "./common/TaskChoice.jsx";
import { MatchTranslation } from "./learning/MatchTranslation.jsx";
import { MatchDefinition } from "./learning/MatchDefinition.jsx";
import { SynonymsMatching } from "./learning/SynonymsMatching.jsx";
import { AntonymMatching } from "./learning/AntonymMatching.jsx";
import { ResultsPage } from "./common/ResultsPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/quest" element={<Questionnaire />} />
      <Route path="/learn" element={<WordLoader />} />
      <Route path="/tasks" element={<TaskChoice />} />
      <Route path="/tasks/match-translation" element={<MatchTranslation />} />
      <Route path="/tasks/match-definition" element={<MatchDefinition />} />
      <Route path="/tasks/match-synonyms" element={<SynonymsMatching />} />
      <Route path="/tasks/match-antonyms" element={<AntonymMatching />} />
      <Route path="/results" element={<ResultsPage />} />
    </Routes>
  );
}

export default App;
