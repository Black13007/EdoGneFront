import { UtilisateurResponse } from "./UtilisateurResponse";

export interface EmployeResponse extends UtilisateurResponse {
    domainePrincipal: string;
    bio: string;
    anneesExperience: number;
    disponibilite: boolean;
    documentsCertifications: string;
    
}
