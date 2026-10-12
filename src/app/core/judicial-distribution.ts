import { JudicialDistribution } from "./jurimetry";
import { SearchFailure } from "./search";

/** Validate partitions of the admitted population, never just the visible page. */
export function assertJudicialDistribution(
  distribution: JudicialDistribution,
  population: number,
): void {
  const sum = (values: readonly { publications: number }[]) =>
    values.reduce((total, value) => total + value.publications, 0);
  const unique = (values: readonly (string | null)[]) =>
    new Set(values).size === values.length;
  const invalid = () => {
    throw new SearchFailure(
      "INVALID_RESPONSE",
      "As distribuições de órgãos, relatores ou classes não correspondem à população do recorte.",
    );
  };
  if (
    sum(distribution.courts) !== population ||
    !unique(distribution.courts.map((court) => court.name))
  )
    invalid();
  for (const court of distribution.courts) {
    if (
      sum(court.organs) !== court.publications ||
      !unique(court.organs.map((organ) => organ.name))
    )
      invalid();
    for (const organ of court.organs) {
      if (
        sum(organ.rapporteurs) +
          organ.missingRapporteur +
          organ.ambiguousRapporteur !==
          organ.publications ||
        !unique(organ.rapporteurs.map((rapporteur) => rapporteur.name))
      )
        invalid();
    }
  }
  if (
    sum(distribution.classes) + distribution.missingClassCode !== population ||
    !unique(distribution.classes.map((item) => item.code))
  )
    invalid();
  let missingNames = 0;
  for (const item of distribution.classes) {
    if (
      sum(item.names) + item.missingName !== item.publications ||
      !unique(item.names.map((name) => name.name))
    )
      invalid();
    missingNames += item.missingName;
  }
  if (
    distribution.missingClassName < missingNames ||
    distribution.missingClassName > missingNames + distribution.missingClassCode
  )
    invalid();
}
