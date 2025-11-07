import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PostulationRequest } from '../../models/request/PostulationRequest';
import { Observable } from 'rxjs';
import { GestionError } from '../../models/GestionError';
import { PostulationResponse } from '../../models/response/PostulationResponse';

@Injectable({
  providedIn: 'root'
})
export class PostulationService {

private apiUrl = `${environment.apiUrl}/postulations`;
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  createPostulation(request: PostulationRequest): Observable<GestionError<PostulationResponse>> {
      return this.http.post<GestionError<PostulationResponse>>(`${this.apiUrl}`, request);
     }

    updatePostulation(trackingId: string, request: PostulationRequest): Observable<GestionError<PostulationResponse>> {
      return this.http.put<GestionError<PostulationResponse>>(`${this.apiUrl}/${trackingId}`, request);
   }
    getByIdPostulation(trackingId: string): Observable<GestionError<PostulationResponse>> {
      return this.http.get<GestionError<PostulationResponse>>(`${this.apiUrl}/${trackingId}`);
   }

   getAllPostulation(): Observable<GestionError<PostulationResponse[]>> {
    return this.http.get<GestionError<PostulationResponse[]>>(this.apiUrl);
   }

    getByEmployePostulation(employeId: string): Observable<GestionError<PostulationResponse[]>> {
      return this.http.get<GestionError<PostulationResponse[]>>(`${this.apiUrl}/employe/${employeId}`);
   }

    getByOffreEmploiPostulation(offreEmploiId: string): Observable<GestionError<PostulationResponse[]>> {
      return this.http.get<GestionError<PostulationResponse[]>>(`${this.apiUrl}/offre-emploi/${offreEmploiId}`);
    }

    getByStatutPostulation(statut: string): Observable<GestionError<PostulationResponse[]>> {
      return this.http.get<GestionError<PostulationResponse[]>>(`${this.apiUrl}/statut/${statut}`);
    }

    getByEmployeAndStatutPostulation(employeId: string, statut: string): Observable<GestionError<PostulationResponse[]>> {
      return this.http.get<GestionError<PostulationResponse[]>>(`${this.apiUrl}/employe/${employeId}/statut/${statut}`);
    }

    deletePostulation(trackingId: string): Observable<GestionError<void>> {
      return this.http.delete<GestionError<void>>(`${this.apiUrl}/${trackingId}`);
    }

}
