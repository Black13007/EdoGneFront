import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { AuthentificationResponse } from '../../models/response/AuthentificationResponse';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isAuthenticated = false;
  user: AuthentificationResponse | null = null;
  userClaims: any = null;
  photoProfil: string | null = null;

  constructor(private authService: AuthService) {
    this.authService.isAuthenticated$.subscribe(val => this.isAuthenticated = val);
    this.authService.userClaims$.subscribe(claims => {
      this.userClaims = claims;
      if (claims) {
        this.user = {
          email: claims.email,
          role: claims.role,
          token: this.authService.getToken()!,
        } as AuthentificationResponse;
      } else {
        this.user = null;
      }
    });
    this.authService.photoProfil$.subscribe(photo => {
      this.photoProfil = photo;
    });
  }

  logout() {
    this.authService.logout();
  }

  getProfilRoute(): string {
    if (this.userClaims?.role === 'EMPLOYEUR') {
      return '/profil-employeur';
    }
    return '/profil';
  }

  // Helpers de rôle
  isEmployeur(): boolean {
    return this.userClaims?.role === 'EMPLOYEUR';
  }

  isEmploye(): boolean {
    return this.userClaims?.role === 'EMPLOYE';
  }

  // Route d'accueil/dashboard selon rôle
  getDashboardRoute(): string {
    if (!this.isAuthenticated) {
      return '/accueil';
    }
    if (this.isEmployeur()) {
      return '/employeur/dashboard';
    }
    if (this.isEmploye()) {
      return '/employe/dashboard';
    }
    return '/accueil';
  }
}
