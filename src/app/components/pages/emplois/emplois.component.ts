import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OffreEmploiService } from '../../../services/offreEmploi/offre-emploi.service';
import { OffreEmploiResponse } from '../../../models/response/OffreEmploiResponse';
import { PostulationService } from '../../../services/postulation/postulation.service';
import { PostulationRequest } from '../../../models/request/PostulationRequest';
import { AuthService } from '../../../services/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-emplois',
  standalone: false,
  templateUrl: './emplois.component.html',
  styleUrl: './emplois.component.css'
})
export class EmploisComponent implements OnInit {
  offres: OffreEmploiResponse[] = [];
  offresFiltrees: OffreEmploiResponse[] = [];
  loading = false;
  errorMessage = '';
  
  // Modal détails
  selectedOffre: OffreEmploiResponse | null = null;
  showModal = false;
  
  // Modal postulation
  showPostulationModal = false;
  postulationMessage = '';
  postulationLoading = false;
  
  // Filtres de recherche
  searchKeyword = '';
  searchDomaine = '';
  searchVille = '';
  searchTypeContrat = '';

  // Statistiques
  stats = {
    total: 0,
    tempsPlein: 0,
    tempsPartiel: 0,
    stage: 0,
    freelance: 0,
    remote: 0
  };

  constructor(
    private offreEmploiService: OffreEmploiService,
    private postulationService: PostulationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOffres();
  }

  loadOffres(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.offreEmploiService.getAllOffreEmploi().subscribe({
      next: (response) => {
        if (response.information) {
          this.offres = response.information;
          this.offresFiltrees = [...this.offres];
          this.calculerStats();
          this.appliquerFiltres();
        } else {
          this.errorMessage = response.message || 'Erreur lors du chargement des offres';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des offres:', err);
        this.errorMessage = err?.error?.message || 'Impossible de charger les offres d\'emploi';
        this.loading = false;
      }
    });
  }

  calculerStats(): void {
    this.stats.total = this.offres.length;
    this.stats.tempsPlein = this.offres.filter(o => o.typeContrat === 'CDI' || o.typeContrat === 'CDD').length;
    this.stats.tempsPartiel = this.offres.filter(o => o.typeContrat === 'TEMPS_PARTIEL').length;
    this.stats.stage = this.offres.filter(o => o.typeContrat === 'STAGE').length;
    this.stats.freelance = this.offres.filter(o => o.typeContrat === 'FREELANCE').length;
    this.stats.remote = 0; // À adapter selon tes besoins
  }

  appliquerFiltres(): void {
    this.offresFiltrees = this.offres.filter(offre => {
      const matchKeyword = !this.searchKeyword || 
        offre.titre.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        offre.description.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        offre.domaine.toLowerCase().includes(this.searchKeyword.toLowerCase());
      
      const matchDomaine = !this.searchDomaine || offre.domaine === this.searchDomaine;
      const matchVille = !this.searchVille || offre.ville === this.searchVille;
      const matchTypeContrat = !this.searchTypeContrat || offre.typeContrat === this.searchTypeContrat;

      return matchKeyword && matchDomaine && matchVille && matchTypeContrat;
    });
  }

  onSearchChange(): void {
    this.appliquerFiltres();
  }

  reinitialiserFiltres(): void {
    this.searchKeyword = '';
    this.searchDomaine = '';
    this.searchVille = '';
    this.searchTypeContrat = '';
    this.appliquerFiltres();
  }

  getDomainesUniques(): string[] {
    return [...new Set(this.offres.map(o => o.domaine))].sort();
  }

  getVillesUniques(): string[] {
    return [...new Set(this.offres.map(o => o.ville))].sort();
  }

  formaterSalaire(salaire?: number): string {
    if (!salaire) return 'Salaire non spécifié';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      minimumFractionDigits: 0 
    }).format(salaire).replace('XOF', 'FCFA');
  }

  getTypeContratLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'CDI': 'CDI',
      'CDD': 'CDD',
      'STAGE': 'Stage',
      'FREELANCE': 'Freelance',
      'TEMPS_PARTIEL': 'Temps partiel',
      'MISSION': 'Mission'
    };
    return labels[type] || type;
  }

  getDaysAgo(date: string): string {
    const datePublication = new Date(date);
    const aujourdhui = new Date();
    const diffTime = Math.abs(aujourdhui.getTime() - datePublication.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Il y a 1 jour';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  openModal(offre: OffreEmploiResponse): void {
    this.selectedOffre = offre;
    this.showModal = true;
    // Empêcher le scroll du body quand la modal est ouverte
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedOffre = null;
    document.body.style.overflow = 'auto';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  openPostulationModal(offre: OffreEmploiResponse): void {
    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        icon: 'warning',
        title: 'Connexion requise',
        text: 'Veuillez vous connecter pour postuler à cette offre',
        confirmButtonText: 'Se connecter'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/connexion']);
        }
      });
      return;
    }
    
    this.selectedOffre = offre;
    this.postulationMessage = '';
    this.showPostulationModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePostulationModal(): void {
    this.showPostulationModal = false;
    this.selectedOffre = null;
    this.postulationMessage = '';
    document.body.style.overflow = 'auto';
  }

  postuler(): void {
    if (!this.selectedOffre) return;

    // Déterminer l'ID de l'offre à utiliser
    // Si trackingId existe et n'est pas null/undefined, l'utiliser
    // Sinon, utiliser l'id numérique converti en string
    let offreEmploiId: string;
    
    if (this.selectedOffre.trackingId && 
        this.selectedOffre.trackingId !== 'null' && 
        this.selectedOffre.trackingId !== 'undefined' &&
        this.selectedOffre.trackingId.trim() !== '') {
      offreEmploiId = this.selectedOffre.trackingId;
    } else if (this.selectedOffre.id) {
      offreEmploiId = String(this.selectedOffre.id);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Informations de l\'offre incomplètes. Impossible de postuler à cette offre.'
      });
      console.error('❌ Offre invalide - trackingId:', this.selectedOffre.trackingId, 'id:', this.selectedOffre.id);
      return;
    }

    const request: PostulationRequest = {
      offreEmploiId: offreEmploiId,
      message: this.postulationMessage || 'Intéressé par cette offre'
    };
    
    console.log('📦 Données envoyées pour postulation:', request);
    console.log('📋 Offre complète:', this.selectedOffre);


    this.postulationLoading = true;
    
    this.postulationService.createPostulation(request).subscribe({
      next: (response) => {
        if (response.information) {
          Swal.fire({
            icon: 'success',
            title: 'Postulation envoyée!',
            text: 'Votre candidature a été envoyée avec succès.',
            timer: 2000,
            timerProgressBar: true
          });
          this.closePostulationModal();
          // Recharger les offres pour mettre à jour le nombre de postulations
          this.loadOffres();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: response.message || 'Erreur lors de l\'envoi de la postulation'
          });
        }
        this.postulationLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la postulation:', err);
        console.error('Erreur lors de la postulation:', err.message);
        
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.error?.message || 'Impossible d\'envoyer votre candidature. Veuillez réessayer.'
        });
        this.postulationLoading = false;
      }
    });
  }
}
