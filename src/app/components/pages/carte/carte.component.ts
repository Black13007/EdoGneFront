import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OffreEmploiService } from '../../../services/offreEmploi/offre-emploi.service';
import { OffreEmploiResponse } from '../../../models/response/OffreEmploiResponse';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

declare var window: any;

@Component({
  selector: 'app-carte',
  standalone: false,
  templateUrl: './carte.component.html',
  styleUrl: './carte.component.css'
})
export class CarteComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private routeLayer: L.GeoJSON | null = null;
  private userMarker: L.Marker | null = null;
  private readonly GEOAPIFY_API_KEY = '27c2ee6b109847ac89cf13cf5dc792d7';
  private readonly GEOAPIFY_ROUTING_URL = 'https://api.geoapify.com/v1/routing';
  private readonly GEOAPIFY_ROUTE_PLANNER_URL = 'https://api.geoapify.com/v1/routeplanner';
  
  offres: OffreEmploiResponse[] = [];
  offresFiltrees: OffreEmploiResponse[] = [];
  loading = false;
  selectedOffre: OffreEmploiResponse | null = null;
  
  // Position utilisateur
  userPosition: { lat: number; lng: number } | null = null;
  
  // Distances et itinéraires
  distances: Map<number, { distance: number; duration: number }> = new Map();
  currentRoute: { from: { lat: number; lng: number }; to: { lat: number; lng: number }; offre: OffreEmploiResponse } | null = null;
  loadingRoute = false;
  
  // Filtres
  searchKeyword = '';
  selectedType = '';
  sortByDistance = false;

  constructor(
    private offreEmploiService: OffreEmploiService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadOffres();
  }

  ngAfterViewInit(): void {
    // Attendre que le DOM soit prêt avant d'initialiser la carte
    setTimeout(() => {
      this.initMap();
      this.loadOffres();
      
      // Écouter les événements personnalisés pour les boutons dans les popups
      const appElement = document.querySelector('app-carte');
      if (appElement) {
        appElement.addEventListener('showRoute', ((event: CustomEvent) => {
          this.showRouteToOffre(event.detail.offreId);
        }) as EventListener);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.clearRoute();
    if (this.map) {
      this.map.remove();
    }
    
    // Nettoyer l'écouteur d'événements
    const appElement = document.querySelector('app-carte');
    if (appElement) {
      appElement.removeEventListener('showRoute', () => {});
    }
  }

  initMap(): void {
    // Centre par défaut : Lomé, Togo
    const defaultCenter: L.LatLngExpression = [6.1375, 1.2125];
    const defaultZoom = 8;

    // Créer la carte avec les tuiles Geoapify
    this.map = L.map('map-container', {
      center: defaultCenter,
      zoom: defaultZoom
    });

    // Ajouter les tuiles Geoapify
    L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${this.GEOAPIFY_API_KEY}`, {
      attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a>',
      maxZoom: 20
    }).addTo(this.map);

    // Géolocalisation de l'utilisateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          this.userPosition = { lat: userLat, lng: userLng };
          
          if (this.map) {
            this.map.setView([userLat, userLng], 12);
            
            // Ajouter un marqueur pour la position de l'utilisateur
            this.userMarker = L.marker([userLat, userLng], {
              icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })
            })
            .addTo(this.map)
            .bindPopup('<strong>Ma position</strong>')
            .openPopup();
            
            // Calculer les distances après avoir chargé les offres
            if (this.offresFiltrees.length > 0) {
              this.calculateDistances();
            }
          }
        },
        (error) => {
          console.log('Géolocalisation non disponible:', error);
        }
      );
    }
  }

  loadOffres(): void {
    this.loading = true;
    
    this.offreEmploiService.getAllOffreEmploi().subscribe({
      next: (response) => {
        if (response.information) {
          this.offres = response.information;
          this.offresFiltrees = [...this.offres];
          this.applyFilters();
          this.geocodeAndDisplayOffres();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des offres:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.offresFiltrees = this.offres.filter(offre => {
      const matchKeyword = !this.searchKeyword || 
        offre.titre.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        offre.domaine.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        offre.ville.toLowerCase().includes(this.searchKeyword.toLowerCase());
      
      const matchType = !this.selectedType || offre.typeContrat === this.selectedType;
      
      return matchKeyword && matchType;
    });
    
    // Trier par distance si demandé
    if (this.sortByDistance && this.userPosition) {
      this.sortOffresByDistance();
    }
    
    this.geocodeAndDisplayOffres();
    
    // Recalculer les distances si la position utilisateur est disponible
    if (this.userPosition) {
      this.calculateDistances();
    }
  }

  sortOffresByDistance(): void {
    this.offresFiltrees.sort((a, b) => {
      const distA = this.distances.get(a.id || 0)?.distance || Infinity;
      const distB = this.distances.get(b.id || 0)?.distance || Infinity;
      return distA - distB;
    });
  }

  geocodeAndDisplayOffres(): void {
    if (!this.map) return;

    // Supprimer les anciens marqueurs et l'itinéraire
    this.markers.forEach(marker => this.map!.removeLayer(marker));
    this.markers = [];
    this.clearRoute();

    // Géocoder et afficher chaque offre
    let geocodeCount = 0;
    const totalOffres = this.offresFiltrees.length;
    
    this.offresFiltrees.forEach((offre, index) => {
      this.geocodeVille(offre.ville, offre, index).then(() => {
        geocodeCount++;
        // Calculer les distances une fois que tous les marqueurs sont ajoutés
        if (geocodeCount === totalOffres && this.userPosition) {
          setTimeout(() => {
            this.calculateDistances();
          }, 500);
        }
      });
    });
  }

  geocodeVille(ville: string, offre: OffreEmploiResponse, index: number): Promise<void> {
    const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(ville + ', Togo')}&apiKey=${this.GEOAPIFY_API_KEY}`;
    
    return fetch(geocodeUrl)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.geometry.coordinates;
          this.addMarkerToMap(lat, lng, offre);
        }
      })
      .catch(error => {
        console.error(`Erreur de géocodage pour ${ville}:`, error);
      });
  }

  addMarkerToMap(lat: number, lng: number, offre: OffreEmploiResponse): void {
    if (!this.map) return;

    // Créer une icône personnalisée selon le type de contrat
    const iconColor = this.getIconColorByType(offre.typeContrat);
    const iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${iconColor}.png`;
    
    const customIcon = L.icon({
      iconUrl: iconUrl,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Obtenir la distance si disponible
    const distanceInfo = this.distances.get(offre.id || 0);
    const distanceText = distanceInfo 
      ? `<p style="margin: 0 0 4px 0; color: #4263eb; font-size: 0.85em; font-weight: 600;">
          <i class="bi bi-arrow-right-circle"></i> ${this.formatDistance(distanceInfo.distance)} • ${this.formatDuration(distanceInfo.duration)}
        </p>`
      : '';

    const popupContent = `
      <div style="min-width: 200px;">
        <h6 style="margin: 0 0 8px 0; font-weight: 600;">${offre.titre}</h6>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 0.9em;">
          ${offre.employeur ? (offre.employeur.nomEntreprise || offre.employeur.nom + ' ' + offre.employeur.prenom) : 'Employeur'}
        </p>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 0.85em;">
          <i class="bi bi-geo-alt"></i> ${offre.ville}
        </p>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 0.85em;">
          <i class="bi bi-briefcase"></i> ${offre.typeContrat}
        </p>
        ${distanceText}
        <div style="display: flex; gap: 5px; margin-top: 8px;">
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.location.href='/emplois'">
            Détails
          </button>
          ${this.userPosition ? `
          <button class="btn btn-success btn-sm" style="flex: 1;" onclick="window.routeToOffre(${offre.id})">
            <i class="bi bi-signpost"></i> Itinéraire
          </button>
          ` : ''}
        </div>
      </div>
    `;

    const marker = L.marker([lat, lng], { icon: customIcon })
      .addTo(this.map)
      .bindPopup(popupContent);

    // Ajouter un événement de clic pour sélectionner l'offre
    marker.on('click', () => {
      this.selectedOffre = offre;
    });

    this.markers.push(marker);
    
    // Stocker les coordonnées de l'offre pour le calcul de distance
    (marker as any).offreData = { lat, lng, offre };
  }

  getIconColorByType(typeContrat: string): string {
    const typeColors: { [key: string]: string } = {
      'CDI': 'blue',
      'CDD': 'violet',
      'STAGE': 'yellow',
      'FREELANCE': 'orange',
      'APPRENTISSAGE': 'green',
      'TEMPS_PARTIEL': 'grey'
    };
    return typeColors[typeContrat] || 'red';
  }

  getTypeColor(typeContrat: string): string {
    const colors: { [key: string]: string } = {
      'CDI': 'primary',
      'CDD': 'info',
      'STAGE': 'warning',
      'FREELANCE': 'success',
      'APPRENTISSAGE': 'success',
      'TEMPS_PARTIEL': 'secondary'
    };
    return colors[typeContrat] || 'dark';
  }

  onSearch(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  centerOnOffre(offre: OffreEmploiResponse): void {
    if (!this.map) return;
    
    const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(offre.ville + ', Togo')}&apiKey=${this.GEOAPIFY_API_KEY}`;
    
    fetch(geocodeUrl)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.geometry.coordinates;
          this.map!.setView([lat, lng], 13);
          
          // Ouvrir le popup du marqueur correspondant
          const marker = this.markers.find(m => {
            const markerLat = (m as any)._latlng?.lat;
            const markerLng = (m as any)._latlng?.lng;
            return Math.abs(markerLat - lat) < 0.01 && Math.abs(markerLng - lng) < 0.01;
          });
          
          if (marker) {
            marker.openPopup();
          }
        }
      });
  }

  calculateDistances(): void {
    if (!this.userPosition) return;

    // Calculer d'abord les distances en ligne droite pour toutes les offres
    this.offresFiltrees.forEach(offre => {
      const marker = this.markers.find(m => {
        const markerData = (m as any).offreData;
        return markerData && markerData.offre.id === offre.id;
      });

      if (marker) {
        const markerData = (marker as any).offreData;
        const offerLat = markerData.lat;
        const offerLng = markerData.lng;

        // Calculer la distance en ligne droite (haversine) pour l'affichage immédiat
        const distance = this.calculateHaversineDistance(
          this.userPosition!.lat,
          this.userPosition!.lng,
          offerLat,
          offerLng
        );
        
        // Stocker la distance en ligne droite temporairement
        this.distances.set(offre.id || 0, { distance, duration: 0 });
        this.updateMarkerPopup(offre);
      }
    });

    // Calculer les itinéraires réels par lots pour éviter de surcharger l'API
    this.calculateRoutesInBatches();
  }

  calculateRoutesInBatches(): void {
    if (!this.userPosition) return;

    const batchSize = 3; // Limiter à 3 requêtes simultanées
    let currentIndex = 0;

    const processBatch = () => {
      const batch = this.offresFiltrees.slice(currentIndex, currentIndex + batchSize);
      
      if (batch.length === 0) return;

      batch.forEach((offre, batchIndex) => {
        setTimeout(() => {
          const marker = this.markers.find(m => {
            const markerData = (m as any).offreData;
            return markerData && markerData.offre.id === offre.id;
          });

          if (marker) {
            const markerData = (marker as any).offreData;
            const offerLat = markerData.lat;
            const offerLng = markerData.lng;
            
            // Calculer l'itinéraire pour obtenir la distance réelle et la durée
            this.calculateRoute(this.userPosition!, { lat: offerLat, lng: offerLng }, offre);
          }
        }, batchIndex * 200); // Délai entre chaque requête dans le batch
      });

      currentIndex += batchSize;
      
      // Traiter le prochain batch après un délai
      if (currentIndex < this.offresFiltrees.length) {
        setTimeout(processBatch, batchSize * 200);
      }
    };

    processBatch();
  }

  calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  calculateRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }, offre: OffreEmploiResponse): void {
    // Utiliser l'API Route Planner pour un calcul plus précis
    const url = `${this.GEOAPIFY_ROUTE_PLANNER_URL}?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=drive&format=geojson&apiKey=${this.GEOAPIFY_API_KEY}`;
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.features && response.features.length > 0) {
          const feature = response.features[0];
          const properties = feature.properties;
          
          if (properties && properties.distance && properties.time) {
            const distance = properties.distance / 1000; // Convertir en km
            const duration = properties.time; // En secondes
            
            this.distances.set(offre.id || 0, { distance, duration });
            
            // Mettre à jour le popup avec la distance
            this.updateMarkerPopup(offre);
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors du calcul de l\'itinéraire (Route Planner):', error);
        // Fallback vers l'API Routing simple en cas d'erreur
        this.calculateRouteFallback(from, to, offre);
      }
    });
  }

  calculateRouteFallback(from: { lat: number; lng: number }, to: { lat: number; lng: number }, offre: OffreEmploiResponse): void {
    // Fallback vers l'API Routing simple
    const url = `${this.GEOAPIFY_ROUTING_URL}?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=drive&format=geojson&apiKey=${this.GEOAPIFY_API_KEY}`;
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.features && response.features.length > 0) {
          const feature = response.features[0];
          const properties = feature.properties;
          
          if (properties && properties.distance && properties.time) {
            const distance = properties.distance / 1000;
            const duration = properties.time;
            
            this.distances.set(offre.id || 0, { distance, duration });
            this.updateMarkerPopup(offre);
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors du calcul de l\'itinéraire (fallback):', error);
        // Utiliser la distance en ligne droite en cas d'erreur
        const distance = this.calculateHaversineDistance(from.lat, from.lng, to.lat, to.lng);
        this.distances.set(offre.id || 0, { distance, duration: 0 });
      }
    });
  }

  updateMarkerPopup(offre: OffreEmploiResponse): void {
    const marker = this.markers.find(m => {
      const markerData = (m as any).offreData;
      return markerData && markerData.offre.id === offre.id;
    });

    if (marker && this.map) {
      const distanceInfo = this.distances.get(offre.id || 0);
      const markerData = (marker as any).offreData;
      const { lat, lng } = markerData;
      
      const distanceText = distanceInfo 
        ? `<p style="margin: 0 0 4px 0; color: #4263eb; font-size: 0.85em; font-weight: 600;">
            <i class="bi bi-arrow-right-circle"></i> ${this.formatDistance(distanceInfo.distance)} • ${this.formatDuration(distanceInfo.duration)}
          </p>`
        : '';

      const popupContent = `
        <div style="min-width: 200px;">
          <h6 style="margin: 0 0 8px 0; font-weight: 600;">${offre.titre}</h6>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 0.9em;">
            ${offre.employeur ? (offre.employeur.nomEntreprise || offre.employeur.nom + ' ' + offre.employeur.prenom) : 'Employeur'}
          </p>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 0.85em;">
            <i class="bi bi-geo-alt"></i> ${offre.ville}
          </p>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 0.85em;">
            <i class="bi bi-briefcase"></i> ${offre.typeContrat}
          </p>
          ${distanceText}
          <div style="display: flex; gap: 5px; margin-top: 8px;">
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.location.href='/emplois'">
              Détails
            </button>
            ${this.userPosition ? `
            <button class="btn btn-success btn-sm" style="flex: 1;" onclick="window.showRouteToOffre(${offre.id})">
              <i class="bi bi-signpost"></i> Itinéraire
            </button>
            ` : ''}
          </div>
        </div>
      `;

      marker.setPopupContent(popupContent);
    }
  }

  showRouteToOffre(offreId: number): void {
    const offre = this.offresFiltrees.find(o => o.id === offreId);
    if (!offre || !this.userPosition) return;

    const marker = this.markers.find(m => {
      const markerData = (m as any).offreData;
      return markerData && markerData.offre.id === offreId;
    });

    if (!marker) return;

    const markerData = (marker as any).offreData;
    const to = { lat: markerData.lat, lng: markerData.lng };

    this.loadRoute(this.userPosition, to, offre);
  }

  loadRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }, offre: OffreEmploiResponse): void {
    if (!this.map) return;

    this.loadingRoute = true;
    this.currentRoute = { from, to, offre };

    // Supprimer l'ancien itinéraire
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    // Utiliser l'API Route Planner pour un itinéraire optimisé avec instructions détaillées
    const url = `${this.GEOAPIFY_ROUTE_PLANNER_URL}?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=drive&format=geojson&details=instruction_details&apiKey=${this.GEOAPIFY_API_KEY}`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.features && response.features.length > 0) {
          // Créer la couche GeoJSON pour l'itinéraire
          this.routeLayer = L.geoJSON(response, {
            style: () => ({
              color: '#4263eb',
              weight: 6,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            })
          }).addTo(this.map!);

          // Ajouter des marqueurs pour le départ et l'arrivée
          this.addRouteMarkers(from, to, offre);

          // Ajuster la vue pour afficher l'itinéraire complet avec un padding
          const bounds = this.routeLayer.getBounds();
          this.map!.fitBounds(bounds, { padding: [80, 80] });

          // Extraire et afficher les informations de l'itinéraire
          this.displayRouteInfo(response, offre);
        }
        this.loadingRoute = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'itinéraire (Route Planner):', error);
        // Fallback vers l'API Routing simple
        this.loadRouteFallback(from, to, offre);
      }
    });
  }

  loadRouteFallback(from: { lat: number; lng: number }, to: { lat: number; lng: number }, offre: OffreEmploiResponse): void {
    if (!this.map) return;

    const url = `${this.GEOAPIFY_ROUTING_URL}?waypoints=${from.lat},${from.lng}|${to.lat},${to.lng}&mode=drive&format=geojson&apiKey=${this.GEOAPIFY_API_KEY}`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.features && response.features.length > 0) {
          this.routeLayer = L.geoJSON(response, {
            style: () => ({
              color: '#4263eb',
              weight: 5,
              opacity: 0.7
            })
          }).addTo(this.map!);

          this.addRouteMarkers(from, to, offre);
          const bounds = this.routeLayer.getBounds();
          this.map!.fitBounds(bounds, { padding: [50, 50] });
        }
        this.loadingRoute = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'itinéraire (fallback):', error);
        this.loadingRoute = false;
      }
    });
  }

  addRouteMarkers(from: { lat: number; lng: number }, to: { lat: number; lng: number }, offre: OffreEmploiResponse): void {
    if (!this.map) return;

    // Supprimer les anciens marqueurs d'itinéraire s'ils existent
    const existingStartMarker = (this.map as any)._routeStartMarker;
    const existingEndMarker = (this.map as any)._routeEndMarker;
    
    if (existingStartMarker) this.map.removeLayer(existingStartMarker);
    if (existingEndMarker) this.map.removeLayer(existingEndMarker);

    // Marqueur de départ (position utilisateur)
    const startIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const startMarker = L.marker([from.lat, from.lng], { icon: startIcon })
      .addTo(this.map)
      .bindPopup('<strong>Départ</strong><br>Ma position');

    // Marqueur d'arrivée (offre d'emploi)
    const endIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const endMarker = L.marker([to.lat, to.lng], { icon: endIcon })
      .addTo(this.map)
      .bindPopup(`<strong>Arrivée</strong><br>${offre.titre}`);

    // Stocker les références pour pouvoir les supprimer plus tard
    (this.map as any)._routeStartMarker = startMarker;
    (this.map as any)._routeEndMarker = endMarker;
  }

  displayRouteInfo(routeResponse: any, offre: OffreEmploiResponse): void {
    if (!routeResponse.features || routeResponse.features.length === 0) return;

    const feature = routeResponse.features[0];
    const properties = feature.properties;

    if (properties && properties.distance && properties.time) {
      const distance = properties.distance / 1000; // km
      const duration = properties.time; // secondes

      // Mettre à jour les informations de distance pour cette offre
      this.distances.set(offre.id || 0, { distance, duration });
    }
  }

  clearRoute(): void {
    if (this.map) {
      // Supprimer la couche d'itinéraire
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
      }

      // Supprimer les marqueurs de départ et d'arrivée
      const startMarker = (this.map as any)._routeStartMarker;
      const endMarker = (this.map as any)._routeEndMarker;
      
      if (startMarker) {
        this.map.removeLayer(startMarker);
        (this.map as any)._routeStartMarker = null;
      }
      
      if (endMarker) {
        this.map.removeLayer(endMarker);
        (this.map as any)._routeEndMarker = null;
      }

      this.currentRoute = null;
    }
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  formatDuration(duration: number): string {
    if (duration === 0) return '';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  }

  toggleSortByDistance(): void {
    this.sortByDistance = !this.sortByDistance;
    this.applyFilters();
  }
}

// Exposer les fonctions globales pour les boutons dans les popups Leaflet
(window as any).showRouteToOffre = (offreId: number) => {
  // Trouver l'instance du composant via Angular
  const appElement = document.querySelector('app-carte');
  if (appElement) {
    // Essayer différentes méthodes pour obtenir l'instance
    const ngElement = appElement as any;
    if (ngElement.__ngContext__) {
      // Chercher l'instance du composant dans le contexte
      for (let i = 0; i < ngElement.__ngContext__.length; i++) {
        const ctx = ngElement.__ngContext__[i];
        if (ctx && ctx.showRouteToOffre && typeof ctx.showRouteToOffre === 'function') {
          ctx.showRouteToOffre(offreId);
          return;
        }
      }
    }
    // Méthode alternative : utiliser un événement personnalisé
    const event = new CustomEvent('showRoute', { detail: { offreId } });
    appElement.dispatchEvent(event);
  }
};
