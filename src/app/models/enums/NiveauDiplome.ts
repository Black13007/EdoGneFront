export enum NiveauDiplome {
  BEP = 'BEP',
  CAP = 'CAP',
  BAC = 'BAC',
  LICENCE = 'LICENCE',
  MASTER = 'MASTER',
  DOCTORAT = 'DOCTORAT'
}

export const NIVEAU_DIPLOME_LABELS: { [key in NiveauDiplome]: string } = {
  [NiveauDiplome.BEP]: 'BEP',
  [NiveauDiplome.CAP]: 'CAP',
  [NiveauDiplome.BAC]: 'BAC',
  [NiveauDiplome.LICENCE]: 'Licence',
  [NiveauDiplome.MASTER]: 'Master',
  [NiveauDiplome.DOCTORAT]: 'Doctorat'
};

