export interface PostulationResponse { 
    id:number;
    trackingId:string;
    date:string;
    statut:string;
    message:string;
    nom : string ;
    prenom?: string;
    adresse?: string;
    latitude?: number;
    longitude?: number;
    email?: string;
    telephone?: string;
    titreOffre : string ;
}
