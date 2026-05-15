const procedureCategoryRules: Array<{ category: string; keywords: string[] }> = [
  {
    category: "cirugia general",
    keywords: [
      "hernioplastia",
      "herniorrafia",
      "apendicectomia",
      "colecistectomia",
      "laparotomia",
      "hemorroidectomia",
    ],
  },
  {
    category: "cirugia ortopedica",
    keywords: [
      "artroscopia",
      "osteosintesis",
      "protesis",
      "fractura",
      "ligamento",
      "menisco",
    ],
  },
  {
    category: "cirugia neurologica",
    keywords: [
      "craneotomia",
      "laminectomia",
      "microdiscectomia",
      "neurocirugia",
      "columna",
    ],
  },
  {
    category: "cirugia oftalmologica",
    keywords: [
      "catarata",
      "vitrectomia",
      "retina",
      "glaucoma",
      "oftalmologica",
    ],
  },
  {
    category: "cirugia urologica",
    keywords: [
      "ureteroscopia",
      "litotricia",
      "nefrectomia",
      "prostata",
      "urologica",
    ],
  },
  {
    category: "cirugia oncologica",
    keywords: [
      "mastectomia",
      "tumor",
      "oncologica",
      "colectomia",
      "biopsia oncologica",
    ],
  },
];

const documentAliasGroups = new Map<string, string[]>([
  [
    "resultados de laboratorio",
    ["examenes de laboratorio", "resultados de laboratorio", "laboratorio", "analitica"],
  ],
  [
    "examenes preoperatorios",
    ["examenes preoperatorios", "evaluacion preoperatoria", "preoperatorios"],
  ],
  [
    "estudios de imagenes",
    ["estudios de imagenes", "imagenes", "ecografia", "tomografia", "resonancia", "radiografia"],
  ],
  [
    "cedula del paciente",
    ["cedula del paciente", "cedula", "documento de identidad", "identificacion"],
  ],
  [
    "carnet de aseguradora",
    ["carnet de aseguradora", "carnet del seguro", "credencial de aseguradora", "carnet"],
  ],
  [
    "historia clinica",
    ["historia clinica", "historia médica", "historia medica"],
  ],
  [
    "orden medica",
    ["orden medica", "orden médica"],
  ],
  [
    "consentimiento informado",
    ["consentimiento informado"],
  ],
  [
    "valoracion anestesica",
    ["valoracion anestesica", "evaluacion anestesica", "valoracion preanestesica"],
  ],
]);

export function normalizeMedicalText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getProcedureCategories(procedure: string): string[] {
  const normalizedProcedure = normalizeMedicalText(procedure);

  return procedureCategoryRules
    .filter((rule) => rule.keywords.some((keyword) => normalizedProcedure.includes(normalizeMedicalText(keyword))))
    .map((rule) => rule.category);
}

export function documentsMatch(requiredDocument: string, submittedDocument: string): boolean {
  const normalizedRequired = normalizeMedicalText(requiredDocument);
  const normalizedSubmitted = normalizeMedicalText(submittedDocument);

  if (normalizedRequired === normalizedSubmitted) {
    return true;
  }

  const aliasEntry =
    documentAliasGroups.get(normalizedRequired) ??
    Array.from(documentAliasGroups.entries()).find(([, aliases]) =>
      aliases.some((alias) => normalizeMedicalText(alias) === normalizedRequired),
    )?.[1];

  if (!aliasEntry) {
    return normalizedSubmitted.includes(normalizedRequired) || normalizedRequired.includes(normalizedSubmitted);
  }

  return aliasEntry.some((alias) => normalizeMedicalText(alias) === normalizedSubmitted);
}

export function procedureMatchesCoverage(procedure: string, coveredProcedure: string): boolean {
  const normalizedProcedure = normalizeMedicalText(procedure);
  const normalizedCovered = normalizeMedicalText(coveredProcedure);

  if (normalizedProcedure === normalizedCovered) {
    return true;
  }

  if (
    normalizedProcedure.includes(normalizedCovered) ||
    normalizedCovered.includes(normalizedProcedure)
  ) {
    return true;
  }

  const categories = getProcedureCategories(procedure);
  return categories.includes(normalizedCovered);
}
