import { JudicialDistribution } from "../src/app/core/jurimetry";
export function judicialDistribution(): JudicialDistribution {
  return {
    courts: [
      {
        name: "TJGO",
        publications: 4,
        organs: [
          {
            name: "1ª Vara",
            publications: 3,
            rapporteurs: [{ name: "Maria Silva", publications: 2 }],
            missingRapporteur: 1,
            ambiguousRapporteur: 0,
          },
          {
            name: "2ª Vara",
            publications: 1,
            rapporteurs: [{ name: "João Lima", publications: 1 }],
            missingRapporteur: 0,
            ambiguousRapporteur: 0,
          },
        ],
      },
      {
        name: "TJSP",
        publications: 1,
        organs: [
          {
            name: "1ª Vara",
            publications: 1,
            rapporteurs: [{ name: "Maria Silva", publications: 1 }],
            missingRapporteur: 0,
            ambiguousRapporteur: 0,
          },
        ],
      },
      {
        name: null,
        publications: 1,
        organs: [
          {
            name: null,
            publications: 1,
            rapporteurs: [],
            missingRapporteur: 0,
            ambiguousRapporteur: 1,
          },
        ],
      },
    ],
    classes: [
      {
        code: "198",
        publications: 3,
        names: [
          { name: "Apelação", publications: 2 },
          { name: "Apelação Cível", publications: 1 },
        ],
        missingName: 0,
      },
      {
        code: "7",
        publications: 1,
        names: [{ name: "Apelação", publications: 1 }],
        missingName: 0,
      },
      { code: "111", publications: 1, names: [], missingName: 1 },
    ],
    missingClassCode: 1,
    missingClassName: 2,
  };
}
