
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { AuthentificationRequest } from '../../../models/request/AuthentificationRequest';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-se-connecter',
  standalone: false,
  templateUrl: './se-connecter.component.html',
  styleUrl: './se-connecter.component.css'
})
export class SeConnecterComponent{
  auth: AuthentificationRequest = {
    email: '',
    password: ''
  };
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    if (this.auth.email && this.auth.password) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.authenticate(this.auth).subscribe({
        next: (response) => {
          if (response.information) {
            this.authService.handleAuthentication(response.information);
            this.messageSucces();
          } else {
            this.errorMessage = response.message || 'Erreur lors de la connexion.';
            console.error('Je suis ici boss', this.errorMessage);
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur de connexion:', err);
          this.messageErreur(err?.error?.message);
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs';
    }
  }

  private messageSucces(): void {
    Swal.fire({
      icon: 'success',
      title: 'Succès!',
      text: 'Connexion réussie',
      timer: 1200,
      timerProgressBar: true,
    }).then(() => {
      // Redirection automatique gérée dans handleAuthentication
    });
  }

  private messageErreur(error: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur!',
      text: error || 'Une erreur est survenue, veuillez réessayer.',
      confirmButtonText: 'OK',
    });
  }
}