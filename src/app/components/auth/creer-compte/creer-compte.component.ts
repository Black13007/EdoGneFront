import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { EmployeRequest } from '../../../models/request/EmployeRequest';
import { EmployeurRequest } from '../../../models/request/EmployeurRequest';
import Swal from 'sweetalert2';
import { TypeEmployeur } from '../../../enums/TypeEmployeur';

@Component({
  standalone: false,
  selector: 'app-creer-compte',
  templateUrl: './creer-compte.component.html',
  styleUrls: ['./creer-compte.component.css']
})
export class CreerCompteComponent implements OnInit {
  isEmploye: boolean = true;
  currentStep: number = 1;

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

  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.goToStep(1);
  }

  switchType(isEmploye: boolean): void {
    this.isEmploye = isEmploye;
    this.currentStep = 1;
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  nextStep(): void {
    if (this.currentStep < (this.isEmploye ? 2 : 2)) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitEmploye(): void {
    this.loading = true;
    this.authService.registerClient(this.employe).subscribe({
      next: (res) => {
        if (res.information) {
          this.successMessage('Compte employé créé avec succès, veuillez vous connecter.');
        } else {
          this.errorMessage(res.message || 'Erreur lors de la création du compte employé.');
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage(err?.error?.message || 'Erreur serveur lors de l\'inscription.');
        this.loading = false;
      }
    });
  }

  submitEmployeur(): void {
    this.loading = true;
    this.authService.registerPrestataire(this.employeur).subscribe({
      next: (res) => {
        if (res.information) {
          this.successMessage('Compte employeur créé avec succès, veuillez vous connecter.');
        } else {
          this.errorMessage(res.message || 'Erreur lors de la création du compte employeur.');
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage(err?.error?.message || 'Erreur serveur lors de l\'inscription.');
        this.loading = false;
      }
    });
  }

  successMessage(message: string): void {
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

  errorMessage(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33'
    });
  }
}
