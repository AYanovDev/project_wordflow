import { apiParser } from "../parser/api_parser";

function App() {
  async function getWord(word) {
    const response = await fetch(
      `https://freedictionaryapi.com/api/v1/entries/en/${word}?translations=true`,
    );

    const data = await response.json();

    const result = apiParser(data);

    console.log(result);
  }

  getWord("red");
  getWord("green");

  return <div></div>;
}

export default App;
