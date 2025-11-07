import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { EmployeurService } from '../../../services/employeur/employeur.service';
import { EmployeurRequest } from '../../../models/request/EmployeurRequest';
import { EmployeurResponse } from '../../../models/response/EmployeurResponse';
import { TypeEmployeur } from '../../../enums/TypeEmployeur';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profil-employeur',
  standalone: false,
  templateUrl: './profil-employeur.component.html',
  styleUrl: './profil-employeur.component.css'
})
export class ProfilEmployeurComponent implements OnInit {
  @ViewChild('addressInput', { static: false }) addressInput!: ElementRef;
  @ViewChild('photoInput', { static: false }) photoInput!: ElementRef;
  
  private readonly GEOAPIFY_API_KEY = '27c2ee6b109847ac89cf13cf5dc792d7';
  private readonly GEOAPIFY_AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';
  private searchSubject = new Subject<string>();
  
  // Données du profil
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
  
  // États
  loading = false;
  editing = false;
  editingSection: string | null = null; // 'photo', 'infos', 'pro', 'localisation'
  photoPreview: string | null = null;
  selectedPhoto: File | null = null;
  
  // Autocomplétion adresse
  suggestions: any[] = [];
  showSuggestions = false;
  loadingSuggestions = false;
  
  // Claims utilisateur
  claims: any = null;
  trackingId: string | null = null;

  constructor(
    private authService: AuthService,
    private employeurService: EmployeurService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.setupAutocompleteObservable();
  }

  ngOnInit(): void {
    this.claims = this.authService.getCurrentUser();
    if (this.claims?.trackingId) {
      this.trackingId = this.claims.trackingId;
      this.loadEmployeur();
    }
  }

  setupAutocompleteObservable(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query: string) => {
        if (query && query.length >= 3) {
          this.loadingSuggestions = true;
          this.cdr.detectChanges();
          return this.searchAddresses(query);
        } else {
          this.loadingSuggestions = false;
          this.suggestions = [];
          this.showSuggestions = false;
          return of([]);
        }
      })
    ).subscribe({
      next: (results: any[]) => {
        this.suggestions = results;
        this.showSuggestions = results.length > 0;
        this.loadingSuggestions = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors de la recherche d\'adresses:', error);
        this.suggestions = [];
        this.showSuggestions = false;
        this.loadingSuggestions = false;
        this.cdr.detectChanges();
      }
    });
  }

  searchAddresses(query: string): Observable<any[]> {
    const url = `${this.GEOAPIFY_AUTOCOMPLETE_URL}?text=${encodeURIComponent(query)}&lang=fr&filter=countrycode:tg&apiKey=${this.GEOAPIFY_API_KEY}&limit=5`;
    
    return this.http.get<any>(url).pipe(
      map((response: any) => {
        if (response && response.features && Array.isArray(response.features)) {
          return response.features;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Erreur API Geoapify:', error);
        return of([]);
      })
    );
  }

  loadEmployeur(): void {
    if (!this.trackingId) return;
    
    this.loading = true;
    this.employeurService.getEmployeurByTrackingId(this.trackingId).subscribe({
      next: (response) => {
        if (response.information) {
          this.employeur = response.information;
          this.populateForm();
          
          // Mettre à jour la photo dans AuthService
          if (this.employeur.photoProfil) {
            this.authService.updatePhotoProfil(this.employeur.photoProfil);
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
    
    if (this.employeur.photoProfil) {
      this.photoPreview = this.employeur.photoProfil;
    }
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    if (!this.editing) {
      this.populateForm();
    }
  }

  onAddressInput(event: any): void {
    const query = event.target.value?.trim() || '';
    if (query.length >= 3) {
      this.showSuggestions = true;
      this.searchSubject.next(query);
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
      this.loadingSuggestions = false;
    }
  }

  selectAddress(suggestion: any): void {
    if (suggestion && suggestion.properties && suggestion.geometry) {
      this.employeurForm.adresse = suggestion.properties.formatted;
      this.employeurForm.latitude = suggestion.geometry.coordinates[1];
      this.employeurForm.longitude = suggestion.geometry.coordinates[0];
      this.suggestions = [];
      this.showSuggestions = false;
      this.cdr.detectChanges();
    }
  }

  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.cdr.detectChanges();
    }, 300);
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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
      const base64 = await this.employeurService.convertFileToBase64(this.selectedPhoto);
      this.employeurForm.photoProfil = base64;
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
    if (this.employeur) {
      this.photoPreview = this.employeur.photoProfil || null;
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

  saveSection(section: string): void {
    if (!this.trackingId) return;
    
    this.loading = true;
    
    let updateData: Partial<EmployeurRequest> = {};
    
    switch (section) {
      case 'infos':
        if (!this.employeurForm.nom || !this.employeurForm.prenom || !this.employeurForm.email || !this.employeurForm.telephone) {
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
          nom: this.employeurForm.nom,
          prenom: this.employeurForm.prenom,
          email: this.employeurForm.email,
          telephone: this.employeurForm.telephone,
          password: this.employeurForm.password || undefined
        };
        break;
      case 'pro':
        if (!this.employeurForm.typeEmployeur) {
          Swal.fire({
            icon: 'warning',
            title: 'Type d\'employeur requis',
            text: 'Veuillez sélectionner le type d\'employeur.',
            confirmButtonText: 'OK'
          });
          this.loading = false;
          return;
        }
        if (this.employeurForm.typeEmployeur === 'ENTREPRISE' && !this.employeurForm.nomEntreprise) {
          Swal.fire({
            icon: 'warning',
            title: 'Nom d\'entreprise requis',
            text: 'Veuillez indiquer le nom de votre entreprise.',
            confirmButtonText: 'OK'
          });
          this.loading = false;
          return;
        }
        updateData = {
          typeEmployeur: this.employeurForm.typeEmployeur,
          nomEntreprise: this.employeurForm.nomEntreprise,
          secteur: this.employeurForm.secteur,
          description: this.employeurForm.description
        };
        break;
      case 'localisation':
        updateData = {
          adresse: this.employeurForm.adresse,
          latitude: this.employeurForm.latitude,
          longitude: this.employeurForm.longitude
        };
        break;
    }
    
    // Ne pas envoyer le mot de passe s'il est vide
    if (updateData.password === undefined || updateData.password === '') {
      delete updateData.password;
    }
    
    // Préparer les données complètes en gardant les valeurs existantes
    const fullUpdateData: EmployeurRequest = {
      ...this.employeurForm,
      ...updateData,
      role: 'EMPLOYEUR'
    };
    
    this.employeurService.updateEmployeur(this.trackingId, fullUpdateData).subscribe({
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
          this.loadEmployeur();
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
    if (!this.employeurForm.nom || !this.employeurForm.prenom || !this.employeurForm.email || !this.employeurForm.telephone) {
      Swal.fire({
        icon: 'warning',
        title: 'Champs requis',
        text: 'Veuillez remplir tous les champs obligatoires.',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    if (!this.employeurForm.typeEmployeur) {
      Swal.fire({
        icon: 'warning',
        title: 'Type d\'employeur requis',
        text: 'Veuillez sélectionner le type d\'employeur.',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    if (this.employeurForm.typeEmployeur === 'ENTREPRISE' && !this.employeurForm.nomEntreprise) {
      Swal.fire({
        icon: 'warning',
        title: 'Nom d\'entreprise requis',
        text: 'Veuillez indiquer le nom de votre entreprise.',
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
    const updateData: EmployeurRequest = { ...this.employeurForm };
    if (!updateData.password || updateData.password.trim() === '') {
      delete (updateData as any).password;
    }
    
    this.employeurService.updateEmployeur(this.trackingId, updateData).subscribe({
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
          this.loadEmployeur();
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
    if (this.employeur) {
      return `${this.employeur.nom} ${this.employeur.prenom || ''}`.trim();
    }
    return this.claims?.nom ? `${this.claims.nom} ${this.claims.prenom || ''}`.trim() : 'Utilisateur';
  }

  get role(): string {
    return this.employeur?.role || this.claims?.role || 'EMPLOYEUR';
  }
}

