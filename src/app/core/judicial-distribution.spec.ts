import { describe, expect, it } from "vitest";
import { judicialDistribution } from "../../../tests/judicial-fixtures";
import { assertJudicialDistribution } from "./judicial-distribution";
describe("Partições da população judicial", () => {
  it("aceita nomes iguais em pais distintos, variantes de nome na mesma classe e ausência explícita", () => {
    expect(() =>
      assertJudicialDistribution(judicialDistribution(), 6),
    ).not.toThrow();
  });
  it("recusa contagens incoerentes em qualquer nível ou chaves duplicadas no mesmo grupo", () => {
    const valid = judicialDistribution();
    const bad = [
      { ...valid, missingClassCode: 2 },
      { ...valid, missingClassName: 0 },
      { ...valid, courts: [...valid.courts, valid.courts[0]] },
      {
        ...valid,
        courts: [
          {
            ...valid.courts[0],
            organs: [
              { ...valid.courts[0].organs[0], ambiguousRapporteur: 2 },
              valid.courts[0].organs[1],
            ],
          },
          ...valid.courts.slice(1),
        ],
      },
      {
        ...valid,
        classes: [
          {
            ...valid.classes[0],
            names: [
              { name: "Apelação", publications: 2 },
              { name: "Apelação", publications: 1 },
            ],
          },
          ...valid.classes.slice(1),
        ],
      },
    ];
    for (const value of bad)
      expect(() => assertJudicialDistribution(value, 6)).toThrow();
    expect(() => assertJudicialDistribution(valid, 5)).toThrow();
  });
});
