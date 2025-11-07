import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { EmployeService } from '../../../services/employe/employe.service';
import { EmployeRequest } from '../../../models/request/EmployeRequest';
import { EmployeResponse } from '../../../models/response/EmployeResponse';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profil',
  standalone: false,
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.css'
})
export class ProfilComponent implements OnInit {
  @ViewChild('addressInput', { static: false }) addressInput!: ElementRef;
  @ViewChild('photoInput', { static: false }) photoInput!: ElementRef;
  
  private readonly GEOAPIFY_API_KEY = '27c2ee6b109847ac89cf13cf5dc792d7';
  private readonly GEOAPIFY_AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';
  private searchSubject = new Subject<string>();
  
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
    private employeService: EmployeService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.setupAutocompleteObservable();
  }

  ngOnInit(): void {
    this.claims = this.authService.getCurrentUser();
    if (this.claims?.trackingId) {
      this.trackingId = this.claims.trackingId;
      this.loadEmploye();
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

  loadEmploye(): void {
    if (!this.trackingId) return;
    
    this.loading = true;
    this.employeService.getEmployeByTrackingId(this.trackingId).subscribe({
      next: (response) => {
        if (response.information) {
          this.employe = response.information;
          this.populateForm();
          
          // Mettre à jour la photo dans AuthService
          if (this.employe.photoProfil) {
            this.authService.updatePhotoProfil(this.employe.photoProfil);
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
    
    if (this.employe.photoProfil) {
      this.photoPreview = this.employe.photoProfil;
    }
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    if (!this.editing) {
      this.populateForm(); // Réinitialiser le formulaire
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
      this.employeForm.adresse = suggestion.properties.formatted;
      this.employeForm.latitude = suggestion.geometry.coordinates[1];
      this.employeForm.longitude = suggestion.geometry.coordinates[0];
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
    if (this.employe) {
      this.photoPreview = this.employe.photoProfil || null;
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

  saveSection(section: string): void {
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
        updateData = {
          domainePrincipal: this.employeForm.domainePrincipal,
          anneesExperience: this.employeForm.anneesExperience,
          bio: this.employeForm.bio,
          documentsCertifications: this.employeForm.documentsCertifications,
          disponibilite: this.employeForm.disponibilite
        };
        break;
      case 'localisation':
        updateData = {
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
    
    // Préparer les données complètes en gardant les valeurs existantes
    const fullUpdateData: EmployeRequest = {
      ...this.employeForm,
      ...updateData,
      role: 'EMPLOYE'
    };
    
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
}
