import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { GestionError } from '../../models/GestionError';
import { CompetenceRequest } from '../../models/request/CompetenceRequest';
import { CompetenceResponse } from '../../models/response/CompetenceResponse';

@Injectable({
  providedIn: 'root'
})
export class CompetenceService {
  private apiUrl = `${environment.apiUrl}/competences`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getCompetencesByEmploye(employeId: number): Observable<GestionError<CompetenceResponse[]>> {
    return this.http.get<GestionError<CompetenceResponse[]>>(
      `${this.apiUrl}/employe/${employeId}`,
      { headers: this.getHeaders() }
    );
  }

  createCompetence(request: CompetenceRequest): Observable<GestionError<CompetenceResponse>> {
    return this.http.post<GestionError<CompetenceResponse>>(
      this.apiUrl,
      request,
      { headers: this.getHeaders() }
    );
  }

  updateCompetence(id: number, request: CompetenceRequest): Observable<GestionError<CompetenceResponse>> {
    return this.http.put<GestionError<CompetenceResponse>>(
      `${this.apiUrl}/${id}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  deleteCompetence(id: number): Observable<GestionError<string>> {
    return this.http.delete<GestionError<string>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }
}

