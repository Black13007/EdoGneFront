import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { UtilisateurResponse } from '../../models/response/UtilisateurResponse';
import { EmployeResponse } from '../../models/response/EmployeResponse';
import { EmployeurResponse } from '../../models/response/EmployeurResponse';
import { EmployeurService } from '../../services/employeur/employeur.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit{
  claims: any = null;
  photoProfil: string | null = null;
  displayName: string = 'Utilisateur';
  employeur: EmployeurResponse | null = null;
  trackingId: string | null = null;
  loading = false;
  
ngOnInit(): void {
    this.claims = this.authService.getCurrentUser();
    if (this.claims?.trackingId) {
      this.trackingId = this.claims.trackingId;
      this.loadEmployeur();
    }
}

  constructor(
    private authService: AuthService, 
    private employeurService: EmployeurService
  ) {
    
    this.authService.photoProfil$.subscribe(photo => {
      this.photoProfil = photo;
    });
  }

  getProfilRoute(): string {
    if (this.employeur?.role === 'EMPLOYEUR') {
      return '/profil-employeur';
    }
    return '/profil';
  }

  loadEmployeur(): void {
    if (!this.trackingId) return;
    
    this.loading = true;
    this.employeurService.getEmployeurByTrackingId(this.trackingId).subscribe({
      next: (response) => {
        if (response.information) {
          this.employeur = response.information;
          // Mettre à jour la photo dans AuthService
          if (this.employeur.photoProfil) {
            this.authService.updatePhotoProfil(this.employeur.photoProfil);
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.loading = false;
      }
    });
  }
}

  