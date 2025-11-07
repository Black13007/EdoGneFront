import { Component, OnInit } from '@angular/core';
import { PostulationService } from '../../../services/postulation/postulation.service';
import { PostulationResponse } from '../../../models/response/PostulationResponse';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mes-postulations',
  standalone: false,
  templateUrl: './mes-postulations.component.html',
  styleUrl: './mes-postulations.component.css'
})
export class MesPostulationsComponent implements OnInit {
  postulations: PostulationResponse[] = [];
  loading = false;
  errorMessage = '';
  
  // Filtres
  selectedStatut = '';

  constructor(
    private postulationService: PostulationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/connexion']);
      return;
    }
    this.loadPostulations();
  }

  loadPostulations(): void {
    this.loading = true;
    this.errorMessage = '';
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.trackingId) {
      this.errorMessage = 'Impossible de récupérer vos informations';
      this.loading = false;
      return;
    }

    if (this.selectedStatut) {
      this.postulationService.getByEmployeAndStatutPostulation(currentUser.trackingId, this.selectedStatut).subscribe({
        next: (response) => {
          if (response.information) {
            this.postulations = response.information;
          } else {
            this.errorMessage = response.message || 'Erreur lors du chargement';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = err?.error?.message || 'Impossible de charger vos postulations';
          this.loading = false;
        }
      });
    } else {
      this.postulationService.getByEmployePostulation(currentUser.trackingId).subscribe({
        next: (response) => {
          if (response.information) {
            this.postulations = response.information;
          } else {
            this.errorMessage = response.message || 'Erreur lors du chargement';
          }
          this.loading = false;
          console.log('Chargement des postulations pour l\'employé:', currentUser.trackingId);
          console.log('Postulations reçues:', this.postulations);
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = err?.error?.message || 'Impossible de charger vos postulations';
          this.loading = false;
        }
      });
    }
  }

  onStatutChange(): void {
    this.loadPostulations();
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'ACCEPTEE': 'Acceptée',
      'REFUSEE': 'Refusée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée'
    };
    return labels[statut] || statut;
  }

  getStatutBadgeClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'EN_ATTENTE': 'bg-warning',
      'ACCEPTEE': 'bg-success',
      'REFUSEE': 'bg-danger',
      'EN_COURS': 'bg-info',
      'TERMINEE': 'bg-secondary'
    };
    return classes[statut] || 'bg-secondary';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysAgo(date: string): string {
    const datePostulation = new Date(date);
    const aujourdhui = new Date();
    const diffTime = Math.abs(aujourdhui.getTime() - datePostulation.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Il y a 1 jour';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  getStats() {
    return {
      total: this.postulations.length,
      enAttente: this.postulations.filter(p => p.statut === 'EN_ATTENTE').length,
      acceptee: this.postulations.filter(p => p.statut === 'ACCEPTEE').length,
      refusee: this.postulations.filter(p => p.statut === 'REFUSEE').length
    };
  }
}


