import { EmployeurResponse } from "./EmployeurResponse";
import { UtilisateurResponse } from "./UtilisateurResponse";

export interface OffreEmploiResponse {
    id: number;
    trackingId: string;
    titre: string;
    description: string;
    domaine: string;
    ville: string;
    typeContrat: string;
    salaire: number;
    datePublication: string;
    exigences: string;
    employeur: EmployeurResponse;
    nombrePostulations: number;
}

