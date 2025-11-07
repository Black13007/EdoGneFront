import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { RecruteurService } from '../../../services/recruteur.service';
import { Recruteur, OffreEmploi } from '../../../models/recruteur.model';

@Component({
  selector: 'app-recruteur-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recruteur-detail.component.html',
  styleUrls: ['./recruteur-detail.component.css']
})
export class RecruteurDetailComponent implements OnInit {
  recruteur: Recruteur | null = null;
  offres: OffreEmploi[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private recruteurService: RecruteurService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.chargerRecruteur(id);
      this.chargerOffres(id);
    }
  }

  chargerRecruteur(id: string): void {
    this.recruteurService.getRecruteur(id).subscribe(
      recruteur => {
        this.recruteur = recruteur;
        this.loading = false;
      }
    );
  }

  chargerOffres(id: string): void {
    this.recruteurService.getOffresRecruteur(id).subscribe(
      offres => this.offres = offres
    );
  }

  suspendreRecruteur(): void {
    if (this.recruteur) {
      const raison = prompt('Raison de la suspension :');
      if (raison) {
        this.recruteurService.suspendreRecruteur(this.recruteur.id, raison).subscribe(
          () => {
            this.chargerRecruteur(this.recruteur!.id);
          }
        );
      }
    }
  }

  reactiverRecruteur(): void {
    if (this.recruteur) {
      this.recruteurService.reactiverRecruteur(this.recruteur.id).subscribe(
        () => {
          this.chargerRecruteur(this.recruteur!.id);
        }
      );
    }
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'verifie': return 'bg-success';
      case 'en-attente': return 'bg-warning';
      case 'suspendu': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'entreprise': return 'bi-building';
      case 'professionnel': return 'bi-person-badge';
      case 'particulier': return 'bi-person';
      default: return 'bi-person';
    }
  }
}
