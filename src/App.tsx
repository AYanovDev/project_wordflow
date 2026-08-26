import { Routes, Route } from "react-router-dom";
import { Welcome } from "./welcome/Welcome.jsx";
import { Questionnaire } from "./questionnaire/Questionnaire.jsx";
import { WordLoader } from "./common/WordLoader.jsx";
import { TaskChoice } from "./common/TaskChoice.jsx";
import { MatchTranslation } from "./learning/MatchTranslation.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/quest" element={<Questionnaire />} />
      <Route path="/learn" element={<WordLoader />} />
      <Route path="/tasks" element={<TaskChoice />} />
      <Route path="/tasks/match-translation" element={<MatchTranslation />} />
    </Routes>
  );
}

export default App;
