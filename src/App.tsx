import { Routes, Route } from "react-router-dom";
import { Welcome } from "./welcome/Welcome.js";
import { Questionnaire } from "./questionnaire/Questionnaire.js";
import { WordLoader } from "./common/contexts/WordLoader.js";
import { TaskChoice } from "./common/TaskChoice.js";
import { MatchTranslation } from "./learning/MatchTranslation.js";
import { MatchDefinition } from "./learning/MatchDefinition.js";
import { SynonymsMatching } from "./learning/SynonymsMatching.js";
import { AntonymMatching } from "./learning/AntonymMatching.js";
import { ResultsPage } from "./common/ResultsPage.js";
import { WordCards } from "./presentation/WordCards.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/quest" element={<Questionnaire />} />
      <Route
        path="/learn"
        element={
          <WordLoader>
            <WordCards />
          </WordLoader>
        }
      />
      <Route path="/tasks" element={<TaskChoice />} />
      <Route path="/tasks/match-translation" element={<MatchTranslation />} />
      <Route
        path="/tasks/match-definition"
        element={
          <WordLoader>
            <MatchDefinition />
          </WordLoader>
        }
      />
      <Route path="/tasks/match-synonyms" element={<SynonymsMatching />} />
      <Route path="/tasks/match-antonyms" element={<AntonymMatching />} />
      <Route path="/results" element={<ResultsPage />} />
    </Routes>
  );
}

export default App;
