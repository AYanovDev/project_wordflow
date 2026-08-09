export interface aWord {
  word: string;
  partOfSpeech: string;
  forms: string[];
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  translation: string | null;
}

export function apiParser(apiData: any): aWord {
  const entry = apiData.entries[0];
  const firstSense = entry.senses[0];
  console.log(firstSense);
  return {
    word: apiData.word,
    partOfSpeech: entry.partOfSpeech,
    forms: entry.forms?.map((f: any) => f.word) ?? [],
    definition: firstSense.definition,
    examples: firstSense.examples ?? [],
    synonyms: firstSense.synonyms ?? [],
    antonyms: firstSense.antonyms ?? [],
    translation:
      firstSense.translations?.find((t: any) => t.language.code === "ru")
        ?.word ?? null,
  };
}
