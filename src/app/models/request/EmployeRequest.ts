import { UtilisateurRequest } from "./UtilisateurRequest";


export interface EmployeRequest extends UtilisateurRequest {
    bio: string;
    domainePrincipal: string;
    anneesExperience: number;
    disponibilite: boolean;
    documentsCertifications: string;

}


