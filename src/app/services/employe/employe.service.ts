import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { GestionError } from '../../models/GestionError';
import { EmployeRequest } from '../../models/request/EmployeRequest';
import { EmployeResponse } from '../../models/response/EmployeResponse';

@Injectable({
  providedIn: 'root'
})
export class EmployeService {
  private apiUrl = `${environment.apiUrl}/employes`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getEmployeByTrackingId(trackingId: string): Observable<GestionError<EmployeResponse>> {
    return this.http.get<GestionError<EmployeResponse>>(
      `${this.apiUrl}/tracking/${trackingId}`,
      { headers: this.getHeaders() }
    );
  }

  updateEmploye(trackingId: string, request: EmployeRequest): Observable<GestionError<EmployeResponse>> {
    return this.http.put<GestionError<EmployeResponse>>(
      `${this.apiUrl}/${trackingId}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  // Note: L'upload de photo se fait via le champ photoProfil dans updateEmploye
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

  updatePhotoProfil(trackingId: string, photoProfil: string): Observable<GestionError<EmployeResponse>> {
    return this.http.patch<GestionError<EmployeResponse>>(
      `${this.apiUrl}/${trackingId}/photo`,
      { photoProfil },
      { headers: this.getHeaders() }
    );
  }
}


