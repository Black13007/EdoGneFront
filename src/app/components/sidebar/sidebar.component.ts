import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  userClaims: any = null;
  photoProfil: string | null = null;
  displayName: string = 'Utilisateur';

  constructor(private authService: AuthService) {
    this.authService.userClaims$.subscribe(claims => {
      this.userClaims = claims;
      if (claims) {
        this.displayName = `${claims.nom || ''} ${claims.prenom || ''}`.trim() || 'Utilisateur';
      }
    });
    this.authService.photoProfil$.subscribe(photo => {
      this.photoProfil = photo;
    });
  }

  getProfilRoute(): string {
    if (this.userClaims?.role === 'EMPLOYEUR') {
      return '/profil-employeur';
    }
    return '/profil';
  }
}

  