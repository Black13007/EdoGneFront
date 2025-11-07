import { Injectable } from '@angular/core';
import { EmployeRequest } from '../../models/request/EmployeRequest';
import { GestionError } from '../../models/GestionError';
import { AuthentificationRequest } from '../../models/request/AuthentificationRequest';
import { AuthentificationResponse } from '../../models/response/AuthentificationResponse';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { BehaviorSubject, Observable } from 'rxjs';
import { EmployeurRequest } from '../../models/request/EmployeurRequest';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private tokenKey = 'auth_token';
    private userKey = 'user_info';
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    private userClaimsSubject = new BehaviorSubject<any>(null);
    private photoProfilSubject = new BehaviorSubject<string | null>(null);

    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    public userClaims$ = this.userClaimsSubject.asObservable();
    public photoProfil$ = this.photoProfilSubject.asObservable();


  constructor(
    private http: HttpClient, 
    private router: Router
  ) {
    this.checkAuthState();
  }

  private checkAuthState(): void {
    const token = this.getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        this.isAuthenticatedSubject.next(true);
        this.userClaimsSubject.next(decoded);
      } catch (error) {
        console.error("Erreur lors du décodage du token", error);
        this.logout();
      }
    }
  }

   logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticatedSubject.next(false);
    this.userClaimsSubject.next(null);
    this.router.navigate(['/connexion']);
  }

  registerClient(request: EmployeRequest): Observable<GestionError<boolean>> {
    return this.http.post<GestionError<boolean>>(`${this.apiUrl}/register/employe`, request);
  }

  registerPrestataire(request: EmployeurRequest): Observable<GestionError<boolean>> {
    return this.http.post<GestionError<boolean>>(`${this.apiUrl}/register/employeur`, request);
  }

  authenticate(request: AuthentificationRequest): Observable<GestionError<AuthentificationResponse>> {
    return this.http.post<GestionError<AuthentificationResponse>>(`${this.apiUrl}/login`, request);
  }

   handleAuthentication(response: AuthentificationResponse): void {
    if (response.token) {
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.userKey, JSON.stringify(response));
      try {
        const decoded = jwtDecode(response.token);
        this.isAuthenticatedSubject.next(true);
        this.userClaimsSubject.next(decoded);
        
        // Charger la photo de profil depuis le backend si disponible
        this.loadPhotoProfil();
        
        // Redirection automatique selon le rôle
        this.redirectAfterLogin();
      } catch (error) {
        console.error("Erreur lors du décodage du token", error);
      }
    }
  }

  updatePhotoProfil(photoProfil: string | null): void {
    this.photoProfilSubject.next(photoProfil);
  }

  loadPhotoProfil(): void {
    const claims = this.getCurrentUser();
    if (claims?.trackingId) {
      // La photo sera chargée depuis le profil complet
      // Cette méthode sera appelée après le chargement du profil
    }
  }

  getPhotoProfil(): string | null {
    return this.photoProfilSubject.value;
  }

  redirectAfterLogin(): void {
    const userClaims = this.getCurrentUser();
    if (userClaims?.role === 'EMPLOYE') {
      this.router.navigate(['/employe/dashboard']);
    } else if (userClaims?.role === 'EMPLOYEUR') {
      this.router.navigate(['/employe/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): AuthentificationResponse | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  getCurrentUser(): any {
    return this.userClaimsSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}

  