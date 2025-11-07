import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RecruteurService } from '../../../services/recruteur.service';
import { Recruteur, RecruteurFiltres } from '../../../models/recruteur.model';

@Component({
  selector: 'app-recruteurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recruteurs.component.html',
  styleUrls: ['./recruteurs.component.css']
})
export class RecruteursComponent implements OnInit {
  recruteurs: Recruteur[] = [];
  filtres: RecruteurFiltres = {};
  statistiques = {
    total: 0,
    entreprises: 0,
    professionnels: 0,
    particuliers: 0,
    offresActives: 0
  };

  constructor(private recruteurService: RecruteurService) { }

  ngOnInit(): void {
    this.chargerRecruteurs();
    this.chargerStatistiques();
  }

  chargerRecruteurs(): void {
    this.recruteurService.getRecruteurs(this.filtres).subscribe(
      recruteurs => this.recruteurs = recruteurs
    );
  }

  chargerStatistiques(): void {
    this.recruteurService.getStatistiques().subscribe(
      stats => {
        this.statistiques.total = stats.total;
        this.statistiques.entreprises = stats.parType.entreprise;
        this.statistiques.professionnels = stats.parType.professionnel;
        this.statistiques.particuliers = stats.parType.particulier;
        this.statistiques.offresActives = stats.offresActives;
      }
    );
  }

  appliquerFiltres(): void {
    this.chargerRecruteurs();
  }

  reinitialiserFiltres(): void {
    this.filtres = {};
    this.chargerRecruteurs();
  }

  verifierRecruteur(id: string): void {
    this.recruteurService.verifierRecruteur(id).subscribe(
      () => {
        this.chargerRecruteurs();
        this.chargerStatistiques();
      }
    );
  }

  suspendreRecruteur(id: string): void {
    const raison = prompt('Raison de la suspension :');
    if (raison) {
      this.recruteurService.suspendreRecruteur(id, raison).subscribe(
        () => {
          this.chargerRecruteurs();
          this.chargerStatistiques();
        }
      );
    }
  }
}
