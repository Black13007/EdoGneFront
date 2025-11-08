export enum NiveauCompetence {
  DEBUTANT = 'DEBUTANT',
  INTERMEDIAIRE = 'INTERMEDIAIRE',
  AVANCE = 'AVANCE'
}

export const NIVEAU_COMPETENCE_LABELS: { [key in NiveauCompetence]: string } = {
  [NiveauCompetence.DEBUTANT]: 'Débutant',
  [NiveauCompetence.INTERMEDIAIRE]: 'Intermédiaire',
  [NiveauCompetence.AVANCE]: 'Avancé'
};

