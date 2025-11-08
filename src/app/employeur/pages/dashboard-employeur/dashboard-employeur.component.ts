import { Component, OnInit } from '@angular/core';
import { OffreEmploiService } from '../../../services/offreEmploi/offre-emploi.service';
import { AuthService } from '../../../services/auth/auth.service';
import { OffreEmploiResponse } from '../../../models/response/OffreEmploiResponse';
import Swal from 'sweetalert2';
import { EmployeurService } from '../../../services/employeur/employeur.service';

@Component({
  selector: 'app-dashboard-employeur',
  standalone: false,
  templateUrl: './dashboard-employeur.component.html',
  styleUrl: './dashboard-employeur.component.css'
})
export class DashboardEmployeurComponent implements OnInit {
  loading = false;
  employeurId: number | null = null;
  offres: OffreEmploiResponse[] = [];
  totalOffres = 0;
  selectedOffre: OffreEmploiResponse | null = null;

  constructor(
    private offreService: OffreEmploiService,
    private authService: AuthService,
    private employeurService: EmployeurService
  ) {}

  ngOnInit(): void {
    const claims = this.authService.getCurrentUser();
    const directId: number | null = typeof claims?.id === 'number' ? claims.id : null;
    if (directId != null) {
      this.employeurId = directId;
      this.loadStatsAndOffres(this.employeurId);
      return;
    }
    const tracking: string | null = claims?.trackingId ?? null;
    if (tracking) {
      this.loading = true;
      this.employeurService.getEmployeurByTrackingId(tracking).subscribe({
        next: (res) => {
          this.employeurId = res?.information?.id ?? null;
          if (this.employeurId != null) this.loadStatsAndOffres(this.employeurId);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  loadStatsAndOffres(employeurId: number): void {
    this.loading = true;
    this.offreService.countOffresByEmployeur(employeurId).subscribe({
      next: (res) => {
        this.totalOffres = res?.information ?? 0;
      },
      error: () => {}
    });

    this.offreService.getOffresByEmployeur(employeurId).subscribe({
      next: (res) => {
        this.offres = res?.information ?? [];
        this.loading = false;
      },
      error: () => {
        this.offres = [];
        this.loading = false;
      }
    });
  }

  fermerOffre(id: number): void {
    if (id == null || this.employeurId == null) return;
    Swal.fire({
      icon: 'warning',
      title: 'Fermer cette offre ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, fermer',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.offreService.closeOffre(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Offre fermée', timer: 1500, showConfirmButton: false });
            this.loadStatsAndOffres(this.employeurId!);
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Impossible de fermer.' });
          }
        });
      }
    });
  }

  reouvrirOffre(id: number): void {
    if (id == null || this.employeurId == null) return;
    Swal.fire({
      icon: 'question',
      title: 'Réouvrir cette offre ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, réouvrir',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.offreService.reopenOffre(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Offre réouverte', timer: 1500, showConfirmButton: false });
            this.loadStatsAndOffres(this.employeurId!);
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Impossible de réouvrir.' });
          }
        });
      }
    });
  }

  openDetails(offre: OffreEmploiResponse): void {
    this.selectedOffre = offre;
  }

  closeDetails(): void {
    this.selectedOffre = null;
  }
}
