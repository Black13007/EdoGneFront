import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { GestionError } from '../../models/GestionError';
import { EmployeurRequest } from '../../models/request/EmployeurRequest';
import { EmployeurResponse } from '../../models/response/EmployeurResponse';

@Injectable({
  providedIn: 'root'
})
export class EmployeurService {
  private apiUrl = `${environment.apiUrl}/employeurs`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getEmployeurByTrackingId(trackingId: string): Observable<GestionError<EmployeurResponse>> {
    return this.http.get<GestionError<EmployeurResponse>>(
      `${this.apiUrl}/tracking/${trackingId}`,
      { headers: this.getHeaders() }
    );
  }

  updateEmployeur(trackingId: string, request: EmployeurRequest): Observable<GestionError<EmployeurResponse>> {
    return this.http.put<GestionError<EmployeurResponse>>(
      `${this.apiUrl}/${trackingId}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  // Note: L'upload de photo se fait via le champ photoProfil dans updateEmployeur
  // Cette méthode convertit le fichier en base64 pour l'envoyer dans le champ photoProfil
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  updatePhotoProfil(trackingId: string, photoProfil: string): Observable<GestionError<EmployeurResponse>> {
    return this.http.patch<GestionError<EmployeurResponse>>(
      `${this.apiUrl}/${trackingId}/photo`,
      { photoProfil },
      { headers: this.getHeaders() }
    );
  }
}


