export interface OffreEmploiRequest {
    titre: string;
    description: string;
    domaine: string;
    ville: string;
    typeContrat: string; // CDD, CDI, MISSION, FREELANCE
    salaire?: number;
    exigences?: string;
}

