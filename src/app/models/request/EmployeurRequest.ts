import { TypeEmployeur } from "../../enums/TypeEmployeur";
import { UtilisateurRequest } from "./UtilisateurRequest";

export interface EmployeurRequest extends UtilisateurRequest {
    typeEmployeur: TypeEmployeur; // ENTREPRISE ou PARTICULIER
    nomEntreprise?: string; // Si type = ENTREPRISE
    secteur?: string;
    description?: string;

}

 