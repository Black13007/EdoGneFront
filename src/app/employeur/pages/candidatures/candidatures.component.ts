import { Component, OnInit } from '@angular/core';
import { OffreEmploiService } from '../../../services/offreEmploi/offre-emploi.service';
import { PostulationService } from '../../../services/postulation/postulation.service';
import { AuthService } from '../../../services/auth/auth.service';
import { OffreEmploiResponse } from '../../../models/response/OffreEmploiResponse';
import { PostulationResponse } from '../../../models/response/PostulationResponse';
import Swal from 'sweetalert2';
import { EmployeurService } from '../../../services/employeur/employeur.service';

@Component({
  selector: 'app-candidatures',
  standalone: false,
  templateUrl: './candidatures.component.html',
  styleUrl: './candidatures.component.css'
})
export class CandidaturesComponent implements OnInit {
  loading = false;
  employeurId: number | null = null;
  offres: OffreEmploiResponse[] = [];
  selectedOffreId: number | null = null;
  postulations: PostulationResponse[] = [];

  constructor(
    private offreService: OffreEmploiService,
    private postulationService: PostulationService,
    private authService: AuthService,
    private employeurService: EmployeurService
  ) {}

  ngOnInit(): void {
    const claims = this.authService.getCurrentUser();
    const directId: number | null = typeof claims?.id === 'number' ? claims.id : null;
    if (directId != null) {
      this.employeurId = directId;
      this.loadOffres();
      return;
    }
    const tracking: string | null = claims?.trackingId ?? null;
    if (tracking) {
      this.loading = true;
      this.employeurService.getEmployeurByTrackingId(tracking).subscribe({
        next: (res) => {
          this.employeurId = res?.information?.id ?? null;
          this.loading = false;
          if (this.employeurId != null) this.loadOffres();
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  loadOffres(): void {
    if (this.employeurId == null) return;
    this.loading = true;
    this.offreService.getOffresByEmployeur(this.employeurId).subscribe({
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

  selectOffre(offre: OffreEmploiResponse): void {
    this.selectedOffreId = offre.id;
    this.loadPostulations();
  }

  loadPostulations(): void {
    if (this.selectedOffreId == null) return;
    this.loading = true;
    this.postulationService.getByOffreEmploiPostulation(String(this.selectedOffreId)).subscribe({
      next: (res) => {
        this.postulations = res?.information ?? [];
        this.loading = false;
      },
      error: () => {
        this.postulations = [];
        this.loading = false;
      }
    });
  }

  accepter(postulation: PostulationResponse): void {
    Swal.fire({
      icon: 'question',
      title: 'Accepter cette candidature ?',
      showCancelButton: true,
      confirmButtonText: 'Accepter',
      cancelButtonText: 'Annuler'
    }).then(res => {
      if (res.isConfirmed) {
        this.postulationService.acceptPostulation(postulation.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Candidature acceptée', timer: 1500, showConfirmButton: false });
            this.loadPostulations();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Action impossible.' });
          }
        });
      }
    });
  }

  rejeter(postulation: PostulationResponse): void {
    Swal.fire({
      icon: 'warning',
      title: 'Rejeter cette candidature ?',
      showCancelButton: true,
      confirmButtonText: 'Rejeter',
      cancelButtonText: 'Annuler'
    }).then(res => {
      if (res.isConfirmed) {
        this.postulationService.rejectPostulation(postulation.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Candidature rejetée', timer: 1500, showConfirmButton: false });
            this.loadPostulations();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Action impossible.' });
          }
        });
      }
    });
  }
}
