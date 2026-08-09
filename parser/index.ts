import { apiParser, type aWord } from "./api_parser.ts";
import words from "./words.json" with { type: "json" };
import fs from "node:fs/promises";

async function getWord(word: string) {
  const response = await fetch(
    `https://freedictionaryapi.com/api/v1/entries/en/${word}?translations=true`,
  );

  const data = await response.json();

  const result = apiParser(data);

  return result;
}

let translations: aWord[] = [];

for (const w of words) {
  let t = await getWord(w);
  translations.push(t);
}

await fs.writeFile(
  "src/assets/translations.json",
  JSON.stringify(translations),
  {
    encoding: "utf-8",
  },
);
