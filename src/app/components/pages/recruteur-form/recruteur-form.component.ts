import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { RecruteurService } from '../../../services/recruteur.service';
import { Recruteur, RecruteurType, NiveauAcces } from '../../../models/recruteur.model';

@Component({
  selector: 'app-recruteur-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recruteur-form.component.html',
  styleUrls: ['./recruteur-form.component.css']
})
export class RecruteurFormComponent implements OnInit {
  recruteur: Partial<Recruteur> = {
    type: 'particulier',
    statut: 'en-attente',
    niveauAcces: 'basique',
    actif: true,
    verifie: false
  };

  typesRecruteur = [
    { value: 'entreprise', label: 'Entreprise', icon: 'bi-building', description: 'Société, organisation' },
    { value: 'professionnel', label: 'Professionnel', icon: 'bi-person-badge', description: 'Recruteur indépendant' },
    { value: 'particulier', label: 'Particulier', icon: 'bi-person', description: 'Recruteur occasionnel' }
  ];

  niveauxAcces = [
    { value: 'basique', label: 'Basique', description: 'Accès limité aux fonctionnalités de base' },
    { value: 'standard', label: 'Standard', description: 'Accès aux fonctionnalités standard' },
    { value: 'premium', label: 'Premium', description: 'Accès complet à toutes les fonctionnalités' }
  ];

  secteursActivite = [
    'Technologies de l\'information',
    'Finance et banque',
    'Santé et médecine',
    'Éducation et formation',
    'Commerce et vente',
    'Industrie et production',
    'Services et conseil',
    'Transport et logistique',
    'Immobilier',
    'Tourisme et hôtellerie',
    'Agriculture',
    'Autre'
  ];

  taillesEntreprise = [
    '1-10 employés',
    '11-50 employés',
    '51-200 employés',
    '200+ employés'
  ];

  specialisations = [
    'Ressources Humaines',
    'Technologies de l\'information',
    'Finance',
    'Marketing',
    'Autre'
  ];

  anneesExperience = [
    '0-2 ans',
    '3-5 ans',
    '6-10 ans',
    '10+ ans'
  ];

  typesOffres = [
    'Petits boulots',
    'Services ponctuels',
    'Garde d\'enfants',
    'Ménage',
    'Autre'
  ];

  constructor(
    private recruteurService: RecruteurService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initialiserInformationsSpecifiques();
  }

  initialiserInformationsSpecifiques(): void {
    switch (this.recruteur.type) {
      case 'entreprise':
        this.recruteur.informationsSpecifiques = {
          secteurActivite: '',
          tailleEntreprise: '',
          siteWeb: '',
          numeroEnregistrement: '',
          reseauxSociaux: {}
        };
        break;
      case 'professionnel':
        this.recruteur.informationsSpecifiques = {
          specialisation: '',
          anneesExperience: '',
          certifications: [],
          competences: []
        };
        break;
      case 'particulier':
        this.recruteur.informationsSpecifiques = {
          typeOffres: '',
          zoneIntervention: '',
          preferences: {}
        };
        break;
    }
  }

  onTypeChange(): void {
    this.initialiserInformationsSpecifiques();
  }

  onSubmit(): void {
    if (this.recruteur.nom && this.recruteur.email && this.recruteur.telephone && this.recruteur.localisation) {
      this.recruteurService.creerRecruteur(this.recruteur).subscribe(
        (nouveauRecruteur) => {
          console.log('Recruteur créé:', nouveauRecruteur);
          this.router.navigate(['/recruteurs']);
        },
        (error) => {
          console.error('Erreur lors de la création:', error);
        }
      );
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }

  onCancel(): void {
    this.router.navigate(['/recruteurs']);
  }

  getTypeInfo(type: string) {
    return this.typesRecruteur.find(t => t.value === type);
  }

  isTypeSelected(type: string): boolean {
    return this.recruteur.type === type;
  }

  showEntrepriseInfo(): boolean {
    return this.recruteur.type === 'entreprise';
  }

  showProfessionnelInfo(): boolean {
    return this.recruteur.type === 'professionnel';
  }

  showParticulierInfo(): boolean {
    return this.recruteur.type === 'particulier';
  }
}
