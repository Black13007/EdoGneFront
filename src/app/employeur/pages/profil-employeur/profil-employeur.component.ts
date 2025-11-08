import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { EmployeurService } from '../../../services/employeur/employeur.service';
import { EmployeurRequest } from '../../../models/request/EmployeurRequest';
import { EmployeurResponse } from '../../../models/response/EmployeurResponse';
import { TypeEmployeur } from '../../../enums/TypeEmployeur';
import Swal from 'sweetalert2';

@Component({
  standalone:false,
  selector: 'app-profil-employeur',
  templateUrl: './profil-employeur.component.html',
  styleUrls: ['./profil-employeur.component.css']
})
export class ProfilEmployeurComponent implements OnInit {
  @ViewChild('photoInput', { static: false }) photoInput!: ElementRef;

  employeur: EmployeurResponse | null = null;
  employeurForm: EmployeurRequest = {
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
    adresse: '',
    latitude: undefined,
    longitude: undefined,
    photoProfil: undefined,
  };

  loading = false;
  editing = false;
  editingSection: string | null = null;

  photoPreview: string | null = null;
  selectedPhoto: File | null = null;

  // Valeur affichée pour l'autocomplétion
  addressDisplayValue: string = '';

  claims: any = null;
  trackingId: string | null = null;

  constructor(
    private authService: AuthService,
    private employeurService: EmployeurService
  ) {}

  ngOnInit(): void {
    this.claims = this.authService.getCurrentUser();
    if (this.claims?.trackingId) {
      this.trackingId = this.claims.trackingId;
      this.loadEmployeur();
    }
  }

  // Méthode appelée quand une adresse est sélectionnée depuis le composant Geoapify
  onPlaceSelected(place: any): void {
    if (place && place.properties) {
      const props = place.properties;
      
      // Récupérer l'adresse formatée
      this.employeurForm.adresse = props.formatted || 
        props.address_line1 || 
        `${props.street || ''} ${props.housenumber || ''}, ${props.city || ''}, ${props.country || ''}`.trim();
      
      // Récupérer les coordonnées
      if (place.geometry && place.geometry.coordinates) {
        // Format GeoJSON: [longitude, latitude]
        this.employeurForm.longitude = place.geometry.coordinates[0];
        this.employeurForm.latitude = place.geometry.coordinates[1];
      } else if (props.lon !== undefined && props.lat !== undefined) {
        // Format JSON direct
        this.employeurForm.longitude = props.lon;
        this.employeurForm.latitude = props.lat;
      }
      
      // Mettre à jour la valeur affichée
      this.addressDisplayValue = this.employeurForm.adresse || '';
      
      console.log('Adresse sélectionnée:', {
        adresse: this.employeurForm.adresse,
        latitude: this.employeurForm.latitude,
        longitude: this.employeurForm.longitude
      });
    }
  }

  loadEmployeur(): void {
    if (!this.trackingId) return;
    this.loading = true;
    this.employeurService.getEmployeurByTrackingId(this.trackingId).subscribe({
      next: (response) => {
        if (response.information) {
          this.employeur = response.information;
          this.populateForm();
          if (this.employeur.photoProfil) {
            this.authService.updatePhotoProfil(this.employeur.photoProfil);
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement profil:', err);
        this.loading = false;
      }
    });
  }

  populateForm(): void {
    if (!this.employeur) return;
    this.employeurForm = {
      nom: this.employeur.nom || '',
      prenom: this.employeur.prenom || '',
      email: this.employeur.email || '',
      telephone: this.employeur.telephone || '',
      password: '',
      role: 'EMPLOYEUR',
      typeEmployeur: this.employeur.typeEmployeur || '' as TypeEmployeur,
      nomEntreprise: this.employeur.nomEntreprise || '',
      secteur: this.employeur.secteur || '',
      description: this.employeur.description || '',
      adresse: this.employeur.adresse || '',
      latitude: this.employeur.latitude,
      longitude: this.employeur.longitude,
      photoProfil: this.employeur.photoProfil,
    };
    
    // Mettre à jour la valeur affichée pour l'autocomplétion
    this.addressDisplayValue = this.employeur.adresse || '';
    
    if (this.employeur.photoProfil) {
      this.photoPreview = this.employeur.photoProfil;
    }
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    if (!this.editing) {
      this.populateForm();
      this.editingSection = null;
    }
  }

  editSection(section: string): void {
    this.editingSection = section;
    if (section === 'photo') {
      this.photoInput.nativeElement.click();
    }
    // S'assurer que l'adresse affichée est synchronisée quand on ouvre la modal de localisation
    if (section === 'localisation') {
      this.addressDisplayValue = this.employeurForm.adresse || '';
    }
  }

  cancelEdit(): void {
    this.editingSection = null;
    this.selectedPhoto = null;
    if (this.employeur) {
      this.photoPreview = this.employeur.photoProfil || null;
      // Réinitialiser l'adresse affichée si on annule
      this.addressDisplayValue = this.employeur.adresse || '';
      // Réinitialiser le formulaire
      this.populateForm();
    }
  }

    

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Fichier trop volumineux', text: 'La photo ne doit pas dépasser 5 Mo.', confirmButtonText: 'OK' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        Swal.fire({ icon: 'error', title: 'Format invalide', text: 'Veuillez sélectionner une image.', confirmButtonText: 'OK' });
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
      const base64 = await this.employeurService.convertFileToBase64(this.selectedPhoto);
      this.employeurForm.photoProfil = base64;
    } catch (error) {
      console.error('Erreur conversion photo:', error);
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors du traitement de la photo.', confirmButtonText: 'OK' });
    }
  }

  saveSection(section: string): void {
    if (!this.trackingId) return;
    this.loading = true;
    let updateData: Partial<EmployeurRequest> = {};
    switch (section) {
      case 'infos':
        if (!this.employeurForm.nom || !this.employeurForm.prenom || !this.employeurForm.email || !this.employeurForm.telephone) {
          Swal.fire({ icon: 'warning', title: 'Champs requis', text: 'Veuillez remplir tous les champs obligatoires.', confirmButtonText: 'OK' });
          this.loading = false;
          return;
        }
        updateData = {
          nom: this.employeurForm.nom,
          prenom: this.employeurForm.prenom,
          email: this.employeurForm.email,
          telephone: this.employeurForm.telephone,
          password: this.employeurForm.password || undefined
        };
        break;
      case 'pro':
        if (!this.employeurForm.typeEmployeur) {
          Swal.fire({ icon: 'warning', title: 'Type d\'employeur requis', text: 'Veuillez sélectionner le type d\'employeur.', confirmButtonText: 'OK' });
          this.loading = false;
          return;
        }
        if (this.employeurForm.typeEmployeur === 'ENTREPRISE' && !this.employeurForm.nomEntreprise) {
          Swal.fire({ icon: 'warning', title: 'Nom d\'entreprise requis', text: 'Veuillez indiquer le nom de votre entreprise.', confirmButtonText: 'OK' });
          this.loading = false;
          return;
        }
        updateData = {
          nom: this.employeurForm.nom,
          prenom: this.employeurForm.prenom,
          email: this.employeurForm.email,
          telephone: this.employeurForm.telephone,
          typeEmployeur: this.employeurForm.typeEmployeur,
          nomEntreprise: this.employeurForm.nomEntreprise,
          secteur: this.employeurForm.secteur,
          description: this.employeurForm.description
        };
        break;
      case 'localisation':
        updateData = {
          nom: this.employeurForm.nom,
          prenom: this.employeurForm.prenom,
          email: this.employeurForm.email,
          telephone: this.employeurForm.telephone,
          adresse: this.employeurForm.adresse,
          latitude: this.employeurForm.latitude,
          longitude: this.employeurForm.longitude
        };
        break;
    }

    // Ne pas inclure le password s'il est vide ou undefined
    // Le backend exige @NotBlank, donc on doit soit fournir un password valide, soit ne pas l'inclure
    // Pour les mises à jour partielles, on ne doit pas envoyer le password vide
    if (!updateData.password || updateData.password.trim() === '') {
      delete (updateData as any).password;
    }

    // Construire l'objet complet avec tous les champs requis par le backend
    // Inclure les champs obligatoires même s'ils ne changent pas
    const fullUpdateData: any = {
      nom: updateData.nom || this.employeurForm.nom,
      prenom: updateData.prenom || this.employeurForm.prenom,
      email: updateData.email || this.employeurForm.email,
      telephone: updateData.telephone || this.employeurForm.telephone,
      role: 'EMPLOYEUR',
      typeEmployeur: updateData.typeEmployeur || this.employeurForm.typeEmployeur,
      nomEntreprise: updateData.nomEntreprise !== undefined ? updateData.nomEntreprise : this.employeurForm.nomEntreprise,
      secteur: updateData.secteur !== undefined ? updateData.secteur : this.employeurForm.secteur,
      description: updateData.description !== undefined ? updateData.description : this.employeurForm.description,
      adresse: updateData.adresse !== undefined ? updateData.adresse : this.employeurForm.adresse,
      latitude: updateData.latitude !== undefined ? updateData.latitude : this.employeurForm.latitude,
      longitude: updateData.longitude !== undefined ? updateData.longitude : this.employeurForm.longitude,
      photoProfil: this.employeurForm.photoProfil
    };

    // Ajouter le password seulement s'il est fourni et non vide
    // Le backend a été modifié pour rendre le password optionnel lors des updates
    // donc on ne l'inclut que s'il est fourni
    if (updateData.password && updateData.password.trim() !== '') {
      (fullUpdateData as any).password = updateData.password;
    }
    // Si le password n'est pas fourni, on ne l'inclut pas dans la requête

    this.employeurService.updateEmployeur(this.trackingId, fullUpdateData).subscribe({
      next: (response) => {
        if (response.information) {
          Swal.fire({ icon: 'success', title: 'Section mise à jour', text: 'Les informations ont été mises à jour avec succès.', timer: 2000, showConfirmButton: false });
          this.editingSection = null;
          this.loadEmployeur();
        } else {
          Swal.fire({ icon: 'error', title: 'Erreur', text: response.message || 'Erreur lors de la mise à jour.', confirmButtonText: 'OK' });
        }
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Erreur serveur lors de la mise à jour.', confirmButtonText: 'OK' });
        this.loading = false;
      }
    });
  }

  async saveProfile(): Promise<void> {
    if (!this.trackingId) return;
    if (!this.employeurForm.nom || !this.employeurForm.prenom || !this.employeurForm.email || !this.employeurForm.telephone) {
      Swal.fire({ icon: 'warning', title: 'Champs requis', text: 'Veuillez remplir tous les champs obligatoires.', confirmButtonText: 'OK' });
      return;
    }
    if (!this.employeurForm.typeEmployeur) {
      Swal.fire({ icon: 'warning', title: 'Type d\'employeur requis', text: 'Veuillez sélectionner le type d\'employeur.', confirmButtonText: 'OK' });
      return;
    }
    if (this.employeurForm.typeEmployeur === 'ENTREPRISE' && !this.employeurForm.nomEntreprise) {
      Swal.fire({ icon: 'warning', title: 'Nom d\'entreprise requis', text: 'Veuillez indiquer le nom de votre entreprise.', confirmButtonText: 'OK' });
      return;
    }

    this.loading = true;
    if (this.selectedPhoto) {
      await this.convertPhotoToBase64();
    }

    const updateData: EmployeurRequest = { ...this.employeurForm };
    if (!updateData.password || updateData.password.trim() === '') {
      delete (updateData as any).password;
    }

    this.employeurService.updateEmployeur(this.trackingId, updateData).subscribe({
      next: (response) => {
        if (response.information) {
          Swal.fire({ icon: 'success', title: 'Profil mis à jour', text: 'Votre profil a été mis à jour avec succès.', timer: 2000, showConfirmButton: false });
          this.editing = false;
          this.selectedPhoto = null;
          this.loadEmployeur();
        } else {
          Swal.fire({ icon: 'error', title: 'Erreur', text: response.message || 'Erreur lors de la mise à jour du profil.', confirmButtonText: 'OK' });
        }
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Erreur serveur lors de la mise à jour.', confirmButtonText: 'OK' });
        this.loading = false;
      }
    });
  }

  get displayName(): string {
    if (this.employeur) {
      return `${ this.employeur.nom } ${ this.employeur.prenom || '' }`.trim();
    }
    return this.claims?.nom ? `${ this.claims.nom } ${ this.claims.prenom || '' }`.trim() : 'Utilisateur';
  }

  get role(): string {
    return this.employeur?.role || this.claims?.role || 'EMPLOYEUR';
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
      const base64 = await this.employeurService.convertFileToBase64(this.selectedPhoto);
      
      this.employeurService.updatePhotoProfil(this.trackingId, base64).subscribe({
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
            this.loadEmployeur(); // Recharger les données
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
  

}
