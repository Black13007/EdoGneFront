import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { GestionError } from '../../models/GestionError';
import { DiplomeRequest } from '../../models/request/DiplomeRequest';
import { DiplomeResponse } from '../../models/response/DiplomeResponse';

@Injectable({
  providedIn: 'root'
})
export class DiplomeService {
  private apiUrl = `${environment.apiUrl}/diplomes`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getDiplomesByEmploye(employeId: number): Observable<GestionError<DiplomeResponse[]>> {
    return this.http.get<GestionError<DiplomeResponse[]>>(
      `${this.apiUrl}/employe/${employeId}`,
      { headers: this.getHeaders() }
    );
  }

  createDiplome(request: DiplomeRequest): Observable<GestionError<DiplomeResponse>> {
    return this.http.post<GestionError<DiplomeResponse>>(
      this.apiUrl,
      request,
      { headers: this.getHeaders() }
    );
  }

  updateDiplome(id: number, request: DiplomeRequest): Observable<GestionError<DiplomeResponse>> {
    return this.http.put<GestionError<DiplomeResponse>>(
      `${this.apiUrl}/${id}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  deleteDiplome(id: number): Observable<GestionError<string>> {
    return this.http.delete<GestionError<string>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }
}

