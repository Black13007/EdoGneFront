import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { EmployeService } from '../../../services/employe/employe.service';
import { DiplomeService } from '../../../services/diplome/diplome.service';
import { CompetenceService } from '../../../services/competence/competence.service';
import { DocumentIdentiteService } from '../../../services/documentIdentite/document-identite.service';
import { EmployeRequest } from '../../../models/request/EmployeRequest';
import { EmployeResponse } from '../../../models/response/EmployeResponse';
import { DiplomeResponse } from '../../../models/response/DiplomeResponse';
import { CompetenceResponse } from '../../../models/response/CompetenceResponse';
import { DocumentIdentiteResponse } from '../../../models/response/DocumentIdentiteResponse';
import { DiplomeRequest } from '../../../models/request/DiplomeRequest';
import { CompetenceRequest } from '../../../models/request/CompetenceRequest';
import { DocumentIdentiteRequest } from '../../../models/request/DocumentIdentiteRequest';
import { NiveauDiplome, NIVEAU_DIPLOME_LABELS } from '../../../models/enums/NiveauDiplome';
import { NiveauCompetence, NIVEAU_COMPETENCE_LABELS } from '../../../models/enums/NiveauCompetence';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profil',
  standalone: false,
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.css'
})
export class ProfilComponent implements OnInit {
  @ViewChild('photoInput', { static: false }) photoInput!: ElementRef;
  @ViewChild('documentInput', { static: false }) documentInput!: ElementRef;
  
  // Données du profil
  employe: EmployeResponse | null = null;
  employeForm: EmployeRequest = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    role: 'EMPLOYE',
    domainePrincipal: '',
    anneesExperience: 0,
    disponibilite: true,
    bio: '',
    documentsCertifications: '',
    adresse: '',
    latitude: undefined,
    longitude: undefined,
    photoProfil: undefined,
  };
  
  // États
  loading = false;
  editing = false;
  editingSection: string | null = null; // 'photo', 'infos', 'pro', 'localisation', 'diplomes', 'competences'
  photoPreview: string | null = null;
  selectedPhoto: File | null = null;
  selectedDocument: File | null = null;
  documentPreview: string | null = null;
  
  // Diplômes et compétences
  diplomes: DiplomeResponse[] = [];
  competences: CompetenceResponse[] = [];
  editingDiplome: DiplomeResponse | null = null;
  editingCompetence: CompetenceResponse | null = null;
  
  // CV / Documents
  cvDocuments: DocumentIdentiteResponse[] = [];
  selectedCv: File | null = null;
  isDragging = false;
  
  // Enums pour les templates
  niveauDiplomeEnum = NiveauDiplome;
  niveauDiplomeLabels = NIVEAU_DIPLOME_LABELS;
  niveauCompetenceEnum = NiveauCompetence;
  niveauCompetenceLabels = NIVEAU_COMPETENCE_LABELS;
  niveauDiplomeOptions = Object.values(NiveauDiplome);
  niveauCompetenceOptions = Object.values(NiveauCompetence);
  
  // Valeur affichée pour l'autocomplétion
  addressDisplayValue: string = '';
  
  // Claims utilisateur
  claims: any = null;
  trackingId: string | null = null;
  employeId: number | null = null;

  constructor(
    private authService: AuthService,
    private employeService: EmployeService,
    private diplomeService: DiplomeService,
    private competenceService: CompetenceService,
    private documentIdentiteService: DocumentIdentiteService
  ) {}

  ngOnInit(): void {
    this.claims = this.authService.getCurrentUser();
    if (this.claims?.trackingId) {
      this.trackingId = this.claims.trackingId;
      this.loadEmploye();
    }
  }

  // Méthode appelée quand une adresse est sélectionnée depuis le composant Geoapify
  onPlaceSelected(place: any): void {
    if (place && place.properties) {
      const props = place.properties;
      
      // Récupérer l'adresse formatée
      this.employeForm.adresse = props.formatted || 
        props.address_line1 || 
        `${props.street || ''} ${props.housenumber || ''}, ${props.city || ''}, ${props.country || ''}`.trim();
      
      // Récupérer les coordonnées
      if (place.geometry && place.geometry.coordinates) {
        // Format GeoJSON: [longitude, latitude]
        this.employeForm.longitude = place.geometry.coordinates[0];
        this.employeForm.latitude = place.geometry.coordinates[1];
      } else if (props.lon !== undefined && props.lat !== undefined) {
        // Format JSON direct
        this.employeForm.longitude = props.lon;
        this.employeForm.latitude = props.lat;
      }
      
      // Mettre à jour la valeur affichée
      this.addressDisplayValue = this.employeForm.adresse || '';
      
      console.log('Adresse sélectionnée:', {
        adresse: this.employeForm.adresse,
        latitude: this.employeForm.latitude,
        longitude: this.employeForm.longitude
      });
    }
  }

  loadEmploye(): void {
    if (!this.trackingId) return;
    
    this.loading = true;
    this.employeService.getEmployeByTrackingId(this.trackingId).subscribe({
      next: (response) => {
        if (response.information) {
          this.employe = response.information;
          this.employeId = (this.employe as any).id;
          this.populateForm();
          
          // Mettre à jour la photo dans AuthService
          if (this.employe.photoProfil) {
            this.authService.updatePhotoProfil(this.employe.photoProfil);
          }
          
          // Charger les diplômes, compétences et CV
          if (this.employeId) {
            this.loadDiplomes();
            this.loadCompetences();
          }
          if (this.trackingId) {
            this.loadCvDocuments();
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.loading = false;
      }
    });
  }

  loadDiplomes(): void {
    if (!this.employeId) return;
    this.diplomeService.getDiplomesByEmploye(this.employeId).subscribe({
      next: (response) => {
        if (response.information) {
          this.diplomes = response.information;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des diplômes:', err);
      }
    });
  }

  loadCompetences(): void {
    if (!this.employeId) return;
    this.competenceService.getCompetencesByEmploye(this.employeId).subscribe({
      next: (response) => {
        if (response.information) {
          this.competences = response.information;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des compétences:', err);
      }
    });
  }

  loadCvDocuments(): void {
    if (!this.trackingId) return;
    this.documentIdentiteService.getDocumentsUtilisateur(this.trackingId).subscribe({
      next: (response) => {
        if (response.information) {
          // Filtrer uniquement les CV
          this.cvDocuments = response.information.filter(doc => 
            doc.typeDocument === 'CV' || doc.typeDocument?.toUpperCase().includes('CV')
          );
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des CV:', err);
      }
    });
  }

  populateForm(): void {
    if (!this.employe) return;
    
    this.employeForm = {
      nom: this.employe.nom || '',
      prenom: this.employe.prenom || '',
      email: this.employe.email || '',
      telephone: this.employe.telephone || '',
      password: '', // Ne pas préremplir le mot de passe
      role: 'EMPLOYE',
      domainePrincipal: this.employe.domainePrincipal || '',
      anneesExperience: this.employe.anneesExperience || 0,
      disponibilite: this.employe.disponibilite ?? true,
      bio: this.employe.bio || '',
      documentsCertifications: this.employe.documentsCertifications || '',
      adresse: this.employe.adresse || '',
      latitude: this.employe.latitude,
      longitude: this.employe.longitude,
      photoProfil: this.employe.photoProfil,
    };
    
    // Mettre à jour la valeur affichée pour l'autocomplétion
    this.addressDisplayValue = this.employe.adresse || '';
    
    if (this.employe.photoProfil) {
      this.photoPreview = this.employe.photoProfil;
    }
    
    if (this.employe.documentsCertifications) {
      this.documentPreview = this.employe.documentsCertifications;
    }
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    if (!this.editing) {
      this.populateForm(); // Réinitialiser le formulaire
    }
  }


  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        Swal.fire({
          icon: 'error',
          title: 'Fichier trop volumineux',
          text: 'La photo ne doit pas dépasser 5 Mo.',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Format invalide',
          text: 'Veuillez sélectionner une image.',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      this.selectedPhoto = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async convertPhotoToBase64(): Promise<void> {
    if (!this.selectedPhoto) return;
    
    try {
      const base64 = await this.employeService.convertFileToBase64(this.selectedPhoto);
      this.employeForm.photoProfil = base64;
    } catch (error) {
      console.error('Erreur lors de la conversion de la photo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du traitement de la photo.',
        confirmButtonText: 'OK'
      });
    }
  }

  editSection(section: string): void {
    this.editingSection = section;
    if (section === 'photo') {
      this.photoInput?.nativeElement?.click();
    }
  }

  cancelEdit(): void {
    this.editingSection = null;
    this.selectedPhoto = null;
    this.selectedDocument = null;
    this.selectedCv = null;
    this.isDragging = false;
    this.editingDiplome = null;
    this.editingCompetence = null;
    if (this.employe) {
      this.photoPreview = this.employe.photoProfil || null;
      this.documentPreview = this.employe.documentsCertifications || null;
    }
  }

  async savePhoto(): Promise<void> {
    if (!this.selectedPhoto || !this.trackingId) {
      Swal.fire({
        icon: 'warning',
        title: 'Aucune photo sélectionnée',
        text: 'Veuillez sélectionner une photo.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.loading = true;
    try {
      const base64 = await this.employeService.convertFileToBase64(this.selectedPhoto);
      
      this.employeService.updatePhotoProfil(this.trackingId, base64).subscribe({
        next: (response) => {
          if (response.information) {
            // Mettre à jour la photo dans AuthService pour qu'elle soit visible partout
            this.authService.updatePhotoProfil(response.information.photoProfil || null);
            
            Swal.fire({
              icon: 'success',
              title: 'Photo mise à jour',
              text: 'Votre photo de profil a été mise à jour avec succès.',
              timer: 2000,
              showConfirmButton: false
            });
            
            this.selectedPhoto = null;
            this.editingSection = null;
            this.loadEmploye(); // Recharger les données
          }
          this.loading = false;
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err?.error?.message || 'Erreur lors de la mise à jour de la photo.',
            confirmButtonText: 'OK'
          });
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Erreur lors de la conversion de la photo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du traitement de la photo.',
        confirmButtonText: 'OK'
      });
      this.loading = false;
    }
  }

  async saveSection(section: string): Promise<void> {
    if (!this.trackingId) return;
    
    this.loading = true;
    
    let updateData: Partial<EmployeRequest> = {};
    
    switch (section) {
      case 'infos':
        if (!this.employeForm.nom || !this.employeForm.prenom || !this.employeForm.email || !this.employeForm.telephone) {
          Swal.fire({
            icon: 'warning',
            title: 'Champs requis',
            text: 'Veuillez remplir tous les champs obligatoires.',
            confirmButtonText: 'OK'
          });
          this.loading = false;
          return;
        }
        updateData = {
          nom: this.employeForm.nom,
          prenom: this.employeForm.prenom,
          email: this.employeForm.email,
          telephone: this.employeForm.telephone,
          password: this.employeForm.password || undefined
        };
        break;
      case 'pro':
        if (!this.employeForm.domainePrincipal || this.employeForm.anneesExperience === undefined) {
          Swal.fire({
            icon: 'warning',
            title: 'Champs requis',
            text: 'Veuillez remplir le domaine principal et les années d\'expérience.',
            confirmButtonText: 'OK'
          });
          this.loading = false;
          return;
        }
        // Si un document a été sélectionné, le convertir en base64
        if (this.selectedDocument) {
          try {
            const base64 = await this.employeService.convertFileToBase64(this.selectedDocument);
            this.employeForm.documentsCertifications = base64;
          } catch (error) {
            console.error('Erreur lors de la conversion du document:', error);
          }
        }
        updateData = {
          nom: this.employeForm.nom,
          prenom: this.employeForm.prenom,
          email: this.employeForm.email,
          telephone: this.employeForm.telephone,
          domainePrincipal: this.employeForm.domainePrincipal,
          anneesExperience: this.employeForm.anneesExperience,
          bio: this.employeForm.bio,
          documentsCertifications: this.employeForm.documentsCertifications,
          disponibilite: this.employeForm.disponibilite
        };
        break;
      case 'localisation':
        updateData = {
          nom: this.employeForm.nom,
          prenom: this.employeForm.prenom,
          email: this.employeForm.email,
          telephone: this.employeForm.telephone,
          adresse: this.employeForm.adresse,
          latitude: this.employeForm.latitude,
          longitude: this.employeForm.longitude
        };
        break;
    }
    
    // Ne pas envoyer le mot de passe s'il est vide
    if (updateData.password === undefined || updateData.password === '') {
      delete updateData.password;
    }
    
    // Construire l'objet complet avec tous les champs requis par le backend
    // Inclure les champs obligatoires même s'ils ne changent pas
    const fullUpdateData: any = {
      nom: updateData.nom || this.employeForm.nom,
      prenom: updateData.prenom || this.employeForm.prenom,
      email: updateData.email || this.employeForm.email,
      telephone: updateData.telephone || this.employeForm.telephone,
      role: 'EMPLOYE',
      domainePrincipal: updateData.domainePrincipal !== undefined ? updateData.domainePrincipal : this.employeForm.domainePrincipal,
      anneesExperience: updateData.anneesExperience !== undefined ? updateData.anneesExperience : this.employeForm.anneesExperience,
      disponibilite: updateData.disponibilite !== undefined ? updateData.disponibilite : this.employeForm.disponibilite,
      bio: updateData.bio !== undefined ? updateData.bio : this.employeForm.bio,
      documentsCertifications: updateData.documentsCertifications !== undefined ? updateData.documentsCertifications : this.employeForm.documentsCertifications,
      adresse: updateData.adresse !== undefined ? updateData.adresse : this.employeForm.adresse,
      latitude: updateData.latitude !== undefined ? updateData.latitude : this.employeForm.latitude,
      longitude: updateData.longitude !== undefined ? updateData.longitude : this.employeForm.longitude,
      photoProfil: this.employeForm.photoProfil
    };

    // Ajouter le password seulement s'il est fourni et non vide
    // Le backend a été modifié pour rendre le password optionnel lors des updates
    if (updateData.password && updateData.password.trim() !== '') {
      fullUpdateData.password = updateData.password;
    }
    
    this.employeService.updateEmploye(this.trackingId, fullUpdateData).subscribe({
      next: (response) => {
        if (response.information) {
          Swal.fire({
            icon: 'success',
            title: 'Section mise à jour',
            text: 'Les informations ont été mises à jour avec succès.',
            timer: 2000,
            showConfirmButton: false
          });
          this.editingSection = null;
          this.loadEmploye();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: response.message || 'Erreur lors de la mise à jour.',
            confirmButtonText: 'OK'
          });
        }
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.error?.message || 'Erreur serveur lors de la mise à jour.',
          confirmButtonText: 'OK'
        });
        this.loading = false;
      }
    });
  }

  async saveProfile(): Promise<void> {
    if (!this.trackingId) return;
    
    // Validation
    if (!this.employeForm.nom || !this.employeForm.prenom || !this.employeForm.email || !this.employeForm.telephone) {
      Swal.fire({
        icon: 'warning',
        title: 'Champs requis',
        text: 'Veuillez remplir tous les champs obligatoires.',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    this.loading = true;
    
    // Si une photo a été sélectionnée, la convertir en base64
    if (this.selectedPhoto) {
      await this.convertPhotoToBase64();
    }
    
    // Préparer les données (sans le mot de passe s'il est vide)
    const updateData: EmployeRequest = { ...this.employeForm };
    if (!updateData.password || updateData.password.trim() === '') {
      delete (updateData as any).password;
    }
    
    this.employeService.updateEmploye(this.trackingId, updateData).subscribe({
      next: (response) => {
        if (response.information) {
          Swal.fire({
            icon: 'success',
            title: 'Profil mis à jour',
            text: 'Votre profil a été mis à jour avec succès.',
            timer: 2000,
            showConfirmButton: false
          });
          this.editing = false;
          this.selectedPhoto = null;
          this.loadEmploye();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: response.message || 'Erreur lors de la mise à jour du profil.',
            confirmButtonText: 'OK'
          });
        }
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.error?.message || 'Erreur serveur lors de la mise à jour.',
          confirmButtonText: 'OK'
        });
        this.loading = false;
      }
    });
  }

  get displayName(): string {
    if (this.employe) {
      return `${this.employe.nom} ${this.employe.prenom || ''}`.trim();
    }
    return this.claims?.nom ? `${this.claims.nom} ${this.claims.prenom || ''}`.trim() : 'Utilisateur';
  }

  get role(): string {
    return this.employe?.role || this.claims?.role || 'EMPLOYE';
  }

  // Gestion des documents
  onDocumentSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        Swal.fire({
          icon: 'error',
          title: 'Fichier trop volumineux',
          text: 'Le document ne doit pas dépasser 10 Mo.',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      this.selectedDocument = file;
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const base64 = await this.employeService.convertFileToBase64(file);
          this.employeForm.documentsCertifications = base64;
          this.documentPreview = base64;
        } catch (error) {
          console.error('Erreur lors de la conversion du document:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async saveDocument(): Promise<void> {
    if (!this.selectedDocument || !this.trackingId) {
      Swal.fire({
        icon: 'warning',
        title: 'Aucun document sélectionné',
        text: 'Veuillez sélectionner un document.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.loading = true;
    try {
      const base64 = await this.employeService.convertFileToBase64(this.selectedDocument);
      
      const updateData: any = {
        nom: this.employeForm.nom,
        prenom: this.employeForm.prenom,
        email: this.employeForm.email,
        telephone: this.employeForm.telephone,
        role: 'EMPLOYE',
        domainePrincipal: this.employeForm.domainePrincipal,
        anneesExperience: this.employeForm.anneesExperience,
        disponibilite: this.employeForm.disponibilite,
        bio: this.employeForm.bio,
        documentsCertifications: base64,
        adresse: this.employeForm.adresse,
        latitude: this.employeForm.latitude,
        longitude: this.employeForm.longitude,
        photoProfil: this.employeForm.photoProfil
      };

      this.employeService.updateEmploye(this.trackingId, updateData).subscribe({
        next: (response) => {
          if (response.information) {
            Swal.fire({
              icon: 'success',
              title: 'Document mis à jour',
              text: 'Votre document a été mis à jour avec succès.',
              timer: 2000,
              showConfirmButton: false
            });
            this.selectedDocument = null;
            this.editingSection = null;
            this.loadEmploye();
          }
          this.loading = false;
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err?.error?.message || 'Erreur lors de la mise à jour du document.',
            confirmButtonText: 'OK'
          });
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Erreur lors de la conversion du document:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du traitement du document.',
        confirmButtonText: 'OK'
      });
      this.loading = false;
    }
  }

  // Gestion des diplômes
  addDiplome(): void {
    this.editingDiplome = {
      nomDiplome: '',
      niveau: NiveauDiplome.BAC,
      etablissement: '',
      anneeObtention: new Date().getFullYear().toString()
    } as any;
    (this.editingDiplome as any).employeId = this.employeId || 0;
    this.editingSection = 'diplomes';
  }

  editDiplome(diplome: DiplomeResponse): void {
    // Convertir l'année LocalDate en string pour l'affichage
    let anneeStr = '';
    if (diplome.anneeObtention) {
      // Si c'est déjà une string, l'utiliser directement
      if (typeof diplome.anneeObtention === 'string') {
        anneeStr = diplome.anneeObtention.split('-')[0]; // Extraire l'année de "YYYY-MM-DD"
      } else {
        anneeStr = String(diplome.anneeObtention);
      }
    }
    this.editingDiplome = { 
      ...diplome,
      anneeObtention: anneeStr
    } as any;
    (this.editingDiplome as any).employeId = this.employeId || 0;
    this.editingSection = 'diplomes';
  }

  saveDiplome(): void {
    if (!this.editingDiplome || !this.employeId) return;
    
    if (!this.editingDiplome.nomDiplome || !this.editingDiplome.etablissement || !this.editingDiplome.niveau || !this.editingDiplome.anneeObtention) {
      Swal.fire({
        icon: 'warning',
        title: 'Champs requis',
        text: 'Veuillez remplir tous les champs obligatoires (nom, établissement, niveau, année).',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.loading = true;
    // Convertir l'année en format LocalDate (YYYY-MM-DD)
    const annee = this.editingDiplome.anneeObtention || new Date().getFullYear().toString();
    const anneeStr = typeof annee === 'string' ? annee : String(annee);
    const anneeDate = anneeStr.length === 4 ? `${anneeStr}-01-01` : anneeStr;
    
    const request: DiplomeRequest = {
      nomDiplome: this.editingDiplome.nomDiplome!,
      niveau: this.editingDiplome.niveau!,
      etablissement: this.editingDiplome.etablissement!,
      anneeObtention: anneeDate,
      employeId: this.employeId
    };

    const operation = this.editingDiplome.id 
      ? this.diplomeService.updateDiplome(this.editingDiplome.id, request)
      : this.diplomeService.createDiplome(request);

    operation.subscribe({
      next: (response) => {
        if (response.information) {
          Swal.fire({
            icon: 'success',
            title: this.editingDiplome?.id ? 'Diplôme modifié' : 'Diplôme ajouté',
            text: 'Le diplôme a été enregistré avec succès.',
            timer: 2000,
            showConfirmButton: false
          });
          this.editingDiplome = null;
          this.editingSection = null;
          this.loadDiplomes();
        }
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.error?.message || 'Erreur lors de l\'enregistrement du diplôme.',
          confirmButtonText: 'OK'
        });
        this.loading = false;
      }
    });
  }

  deleteDiplome(id: number): void {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.diplomeService.deleteDiplome(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text: 'Le diplôme a été supprimé.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadDiplomes();
            this.loading = false;
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: err?.error?.message || 'Erreur lors de la suppression.',
              confirmButtonText: 'OK'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  // Gestion des compétences
  addCompetence(): void {
    this.editingCompetence = {
      nomCompetence: '',
      niveau: NiveauCompetence.DEBUTANT
    } as any;
    (this.editingCompetence as any).employeId = this.employeId || 0;
    this.editingSection = 'competences';
  }

  editCompetence(competence: CompetenceResponse): void {
    this.editingCompetence = { ...competence };
    this.editingSection = 'competences';
  }

  saveCompetence(): void {
    if (!this.editingCompetence || !this.employeId) return;
    
    if (!this.editingCompetence.nomCompetence || !this.editingCompetence.niveau) {
      Swal.fire({
        icon: 'warning',
        title: 'Champs requis',
        text: 'Veuillez remplir le nom de la compétence et le niveau.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.loading = true;
    const request: CompetenceRequest = {
      nomCompetence: this.editingCompetence.nomCompetence!,
      niveau: this.editingCompetence.niveau!,
      employeId: this.employeId
    };

    const operation = this.editingCompetence.id 
      ? this.competenceService.updateCompetence(this.editingCompetence.id, request)
      : this.competenceService.createCompetence(request);

    operation.subscribe({
      next: (response) => {
        if (response.information) {
          Swal.fire({
            icon: 'success',
            title: this.editingCompetence?.id ? 'Compétence modifiée' : 'Compétence ajoutée',
            text: 'La compétence a été enregistrée avec succès.',
            timer: 2000,
            showConfirmButton: false
          });
          this.editingCompetence = null;
          this.editingSection = null;
          this.loadCompetences();
        }
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.error?.message || 'Erreur lors de l\'enregistrement de la compétence.',
          confirmButtonText: 'OK'
        });
        this.loading = false;
      }
    });
  }

  deleteCompetence(id: number): void {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.competenceService.deleteCompetence(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text: 'La compétence a été supprimée.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCompetences();
            this.loading = false;
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: err?.error?.message || 'Erreur lors de la suppression.',
              confirmButtonText: 'OK'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  // Gestion du CV
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleCvFile(files[0]);
    }
  }

  onCvFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleCvFile(file);
    }
  }

  handleCvFile(file: File): void {
    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && 
        !file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
      Swal.fire({
        icon: 'error',
        title: 'Format invalide',
        text: 'Veuillez sélectionner un fichier PDF ou Word (.pdf, .doc, .docx).',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Fichier trop volumineux',
        text: 'Le CV ne doit pas dépasser 10 Mo.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.selectedCv = file;
  }

  async uploadCv(): Promise<void> {
    if (!this.selectedCv || !this.trackingId) {
      Swal.fire({
        icon: 'warning',
        title: 'Aucun CV sélectionné',
        text: 'Veuillez sélectionner un fichier CV.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.loading = true;
    const request: DocumentIdentiteRequest = {
      utilisateurTrackingId: this.trackingId,
      typeDocument: 'CV',
      numeroDocument: `CV-${Date.now()}`,
      file: this.selectedCv
    };

    this.documentIdentiteService.soumettreDocument(request).subscribe({
      next: (response) => {
        if (response.information) {
          Swal.fire({
            icon: 'success',
            title: 'CV uploadé',
            text: 'Votre CV a été uploadé avec succès.',
            timer: 2000,
            showConfirmButton: false
          });
          this.selectedCv = null;
          this.editingSection = null;
          this.loadCvDocuments();
        }
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.error?.message || 'Erreur lors de l\'upload du CV.',
          confirmButtonText: 'OK'
        });
        this.loading = false;
      }
    });
  }

  deleteCv(trackingId: string): void {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.documentIdentiteService.deleteDocumentByTrackingId(trackingId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text: 'Le CV a été supprimé.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCvDocuments();
            this.loading = false;
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: err?.error?.message || 'Erreur lors de la suppression.',
              confirmButtonText: 'OK'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  getNiveauDiplomeLabel(niveau: string | undefined): string {
    if (!niveau) return '';
    return NIVEAU_DIPLOME_LABELS[niveau as NiveauDiplome] || niveau;
  }

  getNiveauCompetenceLabel(niveau: string | undefined): string {
    if (!niveau) return '';
    return NIVEAU_COMPETENCE_LABELS[niveau as NiveauCompetence] || niveau;
  }
}
