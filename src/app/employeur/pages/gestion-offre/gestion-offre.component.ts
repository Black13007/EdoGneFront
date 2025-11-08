import { Component, OnInit } from '@angular/core';
import { OffreEmploiService } from '../../../services/offreEmploi/offre-emploi.service';
import { AuthService } from '../../../services/auth/auth.service';
import { OffreEmploiResponse } from '../../../models/response/OffreEmploiResponse';
import { OffreEmploiRequest } from '../../../models/request/OffreEmploiRequest';
import Swal from 'sweetalert2';
import { EmployeurService } from '../../../services/employeur/employeur.service';

@Component({
  selector: 'app-gestion-offre',
  standalone: false,
  templateUrl: './gestion-offre.component.html',
  styleUrl: './gestion-offre.component.css'
})
export class GestionOffreComponent implements OnInit {
  loading = false;
  employeurId: number | null = null;
  offres: OffreEmploiResponse[] = [];
  editingTrackingId: string | null = null;
  editForm: OffreEmploiRequest | null = null;
  selectedOffre: OffreEmploiResponse | null = null;

  // Form minimal selon squelette existant
  form: OffreEmploiRequest = {
    titre: '',
    description: '',
    domaine: '',
    ville: '',
    typeContrat: '',
    salaire: undefined,
    exigences: ''
  };

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

  creerOffre(): void {
    Swal.fire({
      icon: 'question',
      title: 'Créer cette offre ?',
      showCancelButton: true,
      confirmButtonText: 'Créer',
      cancelButtonText: 'Annuler'
    }).then(res => {
      if (res.isConfirmed) {
        this.loading = true;
        this.offreService.creerOffreEmploi(this.form).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Offre créée', timer: 1500, showConfirmButton: false });
            this.resetForm();
            this.loadOffres();
          },
          error: (err) => {
            this.loading = false;
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Création impossible.' });
          }
        });
      }
    });
  }

  majOffre(trackingId: string, data: OffreEmploiRequest): void {
    Swal.fire({
      icon: 'question',
      title: 'Mettre à jour cette offre ?',
      showCancelButton: true,
      confirmButtonText: 'Mettre à jour',
      cancelButtonText: 'Annuler'
    }).then(res => {
      if (res.isConfirmed) {
        this.loading = true;
        this.offreService.updateOffreEmploi(trackingId, data).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Offre mise à jour', timer: 1500, showConfirmButton: false });
            this.editingTrackingId = null;
            this.editForm = null;
            this.loadOffres();
          },
          error: (err) => {
            this.loading = false;
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Mise à jour impossible.' });
          }
        });
      }
    });
  }

  supprimerOffre(trackingId: string): void {
    Swal.fire({
      icon: 'warning',
      title: 'Supprimer cette offre ?',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then(res => {
      if (res.isConfirmed) {
        this.loading = true;
        this.offreService.deleteOffreEmploi(trackingId).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Offre supprimée', timer: 1500, showConfirmButton: false });
            this.loadOffres();
          },
          error: (err) => {
            this.loading = false;
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Suppression impossible.' });
          }
        });
      }
    });
  }

  fermerOffre(id: number): void {
    Swal.fire({
      icon: 'warning',
      title: 'Fermer cette offre ?',
      showCancelButton: true,
      confirmButtonText: 'Fermer',
      cancelButtonText: 'Annuler'
    }).then(res => {
      if (res.isConfirmed) {
        this.offreService.closeOffre(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Offre fermée', timer: 1500, showConfirmButton: false });
            this.loadOffres();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Fermeture impossible.' });
          }
        });
      }
    });
  }

  reouvrirOffre(id: number): void {
    Swal.fire({
      icon: 'question',
      title: 'Réouvrir cette offre ?',
      showCancelButton: true,
      confirmButtonText: 'Réouvrir',
      cancelButtonText: 'Annuler'
    }).then(res => {
      if (res.isConfirmed) {
        this.offreService.reopenOffre(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Offre réouverte', timer: 1500, showConfirmButton: false });
            this.loadOffres();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Réouverture impossible.' });
          }
        });
      }
    });
  }

  startEdit(offre: OffreEmploiResponse): void {
    this.editingTrackingId = offre.trackingId;
    this.editForm = {
      titre: offre.titre,
      description: offre.description,
      domaine: offre.domaine,
      ville: offre.ville,
      typeContrat: offre.typeContrat,
      salaire: offre.salaire,
      exigences: offre.exigences
    };
  }

  cancelEdit(): void {
    this.editingTrackingId = null;
    this.editForm = null;
  }

  saveEdit(): void {
    if (!this.editingTrackingId || !this.editForm) return;
    this.majOffre(this.editingTrackingId, this.editForm);
  }

  openDetails(offre: OffreEmploiResponse): void {
    this.selectedOffre = offre;
  }

  closeDetails(): void {
    this.selectedOffre = null;
  }

  private resetForm(): void {
    this.form = {
      titre: '',
      description: '',
      domaine: '',
      ville: '',
      typeContrat: '',
      salaire: undefined,
      exigences: ''
    };
  }
}
