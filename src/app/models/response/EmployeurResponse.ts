import { Type } from "@angular/core";
import { UtilisateurResponse } from "./UtilisateurResponse";
import { TypeEmployeur } from "../../enums/TypeEmployeur";

export interface EmployeurResponse extends UtilisateurResponse {
    typeEmployeur: TypeEmployeur;
    nomEntreprise: string;
    secteur: string;
    description: string;
    
}
