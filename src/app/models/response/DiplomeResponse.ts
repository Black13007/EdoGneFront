export interface DiplomeResponse {
    id?: number;
    trackingId?: string;
    nomDiplome?: string;
    niveau?: string; // NiveauDiplome enum value
    etablissement?: string;
    anneeObtention?: string | Date;
    employe?: any;
}

