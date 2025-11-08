import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { EmployeRequest } from '../../../models/request/EmployeRequest';
import { EmployeurRequest } from '../../../models/request/EmployeurRequest';
import Swal from 'sweetalert2';
import { TypeEmployeur } from '../../../enums/TypeEmployeur';

@Component({
  selector: 'app-creer-compte',
  standalone: false,
  templateUrl: './creer-compte.component.html',
  styleUrl: './creer-compte.component.css'
})
export class CreerCompteComponent implements OnInit {
  isEmploye: boolean = true;
  currentStep: number = 1;
  loading = false;

  employe: EmployeRequest = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    role: 'EMPLOYE',
    bio: '',
    domainePrincipal: '',
    anneesExperience: 0,
    disponibilite: true,
    documentsCertifications: '',
  };

  employeur: EmployeurRequest = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    role: 'EMPLOYEUR',
    typeEmployeur: '' as TypeEmployeur,
    nomEntreprise: '',
    secteur: '',
    description: '',
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  switchType(isEmploye: boolean) {
    this.isEmploye = isEmploye;
    this.currentStep = 1; // Reset to step 1 when switching type
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    // Only allow going back to completed steps
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  validateCurrentStep(): boolean {
    if (this.currentStep === 1) {
      const data = this.isEmploye ? this.employe : this.employeur;
      if (!data.nom || !data.prenom || !data.email || !data.telephone || !data.password) {
        this.errorMessage('Veuillez remplir tous les champs obligatoires.');
        return false;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        this.errorMessage('Veuillez entrer une adresse email valide.');
        return false;
      }
      // Basic password validation
      if (data.password.length < 6) {
        this.errorMessage('Le mot de passe doit contenir au moins 6 caractères.');
        return false;
      }
    } else if (this.currentStep === 2) {
      if (this.isEmploye) {
        if (!this.employe.domainePrincipal || this.employe.anneesExperience === null) {
          this.errorMessage('Veuillez remplir tous les champs obligatoires.');
          return false;
        }
      } else {
        if (!this.employeur.typeEmployeur) {
          this.errorMessage('Veuillez sélectionner un type d\'employeur.');
          return false;
        }
        if (this.employeur.typeEmployeur === 'ENTREPRISE' && !this.employeur.nomEntreprise) {
          this.errorMessage('Veuillez entrer le nom de l\'entreprise.');
          return false;
        }
      }
    }
    return true;
  }

  submitEmploye() {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.loading = true;
    this.authService.registerClient(this.employe).subscribe({
      next: (res) => {
        if (res.information) {
          this.successMessage('Compte employé créé avec succès, veuillez vous connecter.');
        } else {
          this.errorMessage(res.message || "Erreur lors de la création du compte employé.");
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage(err?.error?.message || "Erreur serveur lors de l'inscription.");
        this.loading = false;
      }
    });
  }

  submitEmployeur() {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.loading = true;
    this.authService.registerPrestataire(this.employeur).subscribe({
      next: (res) => {
        if (res.information) {
          this.successMessage('Compte employeur créé avec succès, veuillez vous connecter.');
        } else {
          this.errorMessage(res.message || "Erreur lors de la création du compte employeur.");
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage(err?.error?.message || "Erreur serveur lors de l'inscription.");
        this.loading = false;
      }
    });
  }

  successMessage(message: string) {
    Swal.fire({
      icon: 'success',
      title: 'Succès!',
      text: message,
      timer: 1800,
      timerProgressBar: true,
      confirmButtonColor: '#3085d6',
    }).then(() => {
      this.router.navigate(['/connexion']);
    });
  }

  errorMessage(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33'
    });
  }
} 