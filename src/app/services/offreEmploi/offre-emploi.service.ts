import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OffreEmploiRequest } from '../../models/request/OffreEmploiRequest';
import { OffreEmploiResponse } from '../../models/response/OffreEmploiResponse';
import { GestionError } from '../../models/GestionError';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OffreEmploiService {

    private apiUrl = `${environment.apiUrl}/offres-emploi`;

  constructor(
    private http: HttpClient, 
    private router: Router
  ) {
    
   }

   creerOffreEmploi(request: OffreEmploiRequest): Observable<GestionError<OffreEmploiResponse>> {
    return this.http.post<GestionError<OffreEmploiResponse>>(`${this.apiUrl}`, request);
   }

  updateOffreEmploi(trackingId: string, request: OffreEmploiRequest): Observable<GestionError<OffreEmploiResponse>> {
    return this.http.put<GestionError<OffreEmploiResponse>>(`${this.apiUrl}/${trackingId}`, request);
  }

  deleteOffreEmploi(trackingId: string): Observable<GestionError<void>> {
    return this.http.delete<GestionError<void>>(`${this.apiUrl}/${trackingId}`);
  }

  getAllOffreEmploi(): Observable<GestionError<OffreEmploiResponse[]>> {
    return this.http.get<GestionError<OffreEmploiResponse[]>>(this.apiUrl);
  }

  getByIdOffreEmploi(trackingId: string): Observable<GestionError<OffreEmploiResponse>> {
    return this.http.get<GestionError<OffreEmploiResponse>>(`${this.apiUrl}/${trackingId}`);
  }

}
