import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GestionError } from '../../models/GestionError';
import { DocumentIdentiteRequest } from '../../models/request/DocumentIdentiteRequest';
import { DocumentIdentiteResponse } from '../../models/response/DocumentIdentiteResponse';

@Injectable({
  providedIn: 'root'
})
export class DocumentIdentiteService {
  private url = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) { }

  // Soumettre un document (avec fichier)
  soumettreDocument(request: DocumentIdentiteRequest): Observable<GestionError<DocumentIdentiteResponse>> {
    const formData = new FormData();
    formData.append('utilisateurTrackingId', request.utilisateurTrackingId);
    formData.append('typeDocument', request.typeDocument);
    formData.append('numeroDocument', request.numeroDocument);
    formData.append('file', request.file);
    return this.http.post<any>(`${this.url}/soumettre`, formData);
  }

  // 2. Valider un document
  // params permet de dire que si un commentaire est renseigné, il sera envoyé dans le cas contraire, on envoie rien (c'est pour ne pas avoir undefined)
  validerDocument(documentId: number, commentaire?: string): Observable<GestionError<DocumentIdentiteResponse>> {
  return this.http.post<GestionError<DocumentIdentiteResponse>>(`${this.url}/${documentId}/valider`,null,
    {
      params: commentaire ? { commentaire } : {}
    }
  );
}



  // 3. Rejeter un document
  rejeterDocument(documentId: number, commentaire?: string): Observable<GestionError<DocumentIdentiteResponse>> {
    return this.http.post<GestionError<DocumentIdentiteResponse>>(`${this.url}/${documentId}/rejeter`, null,  
    {
      params: commentaire ? { commentaire } : {}
    });
  }

  // 4. Récupérer les documents en attente
  getDocumentsEnAttente(): Observable<GestionError<DocumentIdentiteResponse[]>> {
    return this.http.get<GestionError<DocumentIdentiteResponse[]>>(`${this.url}/en-attente`);
  }

  // 5. Récupérer les documents d'un utilisateur
  getDocumentsUtilisateur(utilisateurId: string): Observable<GestionError<DocumentIdentiteResponse[]>> {
    return this.http.get<GestionError<DocumentIdentiteResponse[]>>(`${this.url}/utilisateur/${utilisateurId}`);
  }

  // 5. Récupérer les documents d'un utilisateur
  getDocumentByTrackingId(trackingId: string): Observable<GestionError<DocumentIdentiteResponse>> {
    return this.http.get<GestionError<DocumentIdentiteResponse>>(`${this.url}/${trackingId}`);
  }

  // ❌ Supprimer un document par trackingId
  deleteDocumentByTrackingId(trackingId: string): Observable<GestionError<void>> {
    return this.http.delete<GestionError<void>>(`${this.url}/${trackingId}`);
  }
}
