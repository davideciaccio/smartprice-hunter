import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { lastValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { AuthService } from '../../services/auth';
import { NoticeService } from 'src/app/services/notices.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class MapPage implements OnInit, AfterViewInit {
  isSidebarActive: boolean = false; 
  searchQuery: string = '';
  isSearching: boolean = false;
  private storeMarkers: any[] = []; 
  hasSearchedNearby: boolean = false;
  
  searchResults: any[] = []; 
  isSearchingDb: boolean = false;

  private map: any;
  private userMarker: any;

  unreadCount: number = 0;

  constructor(private http: HttpClient, private authService: AuthService, private noticeService: NoticeService) {}

  ngOnInit() {
    this.noticeService.unreadCount$.subscribe(c => this.unreadCount = c);
    this.noticeService.getNotices().subscribe();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ==========================================
  // INIZIALIZZAZIONE MAPPA
  // ==========================================
  private initMap() {
    this.map = L.map('map').setView([41.8719, 12.5674], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
      this.locateUser(); 
    }, 200);
  }

  // ==========================================
  // GEOLOCALIZZAZIONE (Tu sei qui)
  // ==========================================
  locateUser() {
    if (!navigator.geolocation) {
      alert('Il tuo browser non supporta la geolocalizzazione.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.map.flyTo([lat, lng], 14, {
          animate: true,
          duration: 1.5
        });

        if (this.userMarker) {
          this.map.removeLayer(this.userMarker);
        }

        this.userMarker = L.circleMarker([lat, lng], {
          radius: 9,
          fillColor: '#d9534f',
          color: '#ffffff',
          weight: 3,
          fillOpacity: 1
        }).addTo(this.map);

        this.userMarker.bindPopup('<strong style="color: #0A1128;">Tu sei qui!</strong>').openPopup();
      },
      (error) => {
        console.error('Errore GPS:', error);
        alert('Impossibile ottenere la posizione. Verifica di aver concesso i permessi al browser.');
      }
    );
  }

  // ==========================================
  // LOGICA RICERCA
  // ==========================================
  filterLocations() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return;
    console.log('Ricerca sulla mappa per:', query);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];

    this.clearStoreMarkers(); 
    this.locateUser(); 
  }

  // ==========================================
  // RICERCA NEGOZI DI ELETTRONICA (Overpass API)
  // ==========================================
  findNearbyElectronics() {
    if (!navigator.geolocation) {
      alert('La geolocalizzazione non è supportata dal tuo browser.');
      return;
    }

    this.isSearching = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const radius = 10000; 

        const query = `
          [out:json][timeout:25];
          (
            node["shop"="electronics"](around:${radius},${lat},${lng});
            way["shop"="electronics"](around:${radius},${lat},${lng});
            relation["shop"="electronics"](around:${radius},${lat},${lng});
          );
          out center;
        `;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        fetch(url)
          .then(response => response.json())
          .then(data => {
            this.isSearching = false;
            this.clearStoreMarkers(); 

            if (!data.elements || data.elements.length === 0) {
              alert('Nessun negozio di elettronica trovato nel raggio di 10 km.');
              return;
            }

            this.hasSearchedNearby = true;

            data.elements.forEach((element: any) => {
              const elLat = element.lat || element.center.lat;
              const elLng = element.lon || element.center.lon;
              const name = element.tags?.name || 'Negozio di Elettronica';

              const marker = L.marker([elLat, elLng]).addTo(this.map);
              
              marker.bindPopup(`<strong style="color: #0A1128;">${name}</strong>`);
              this.storeMarkers.push(marker);
            });

            const group = new L.FeatureGroup(this.storeMarkers);
            this.map.fitBounds(group.getBounds().pad(0.1));
          })
          .catch(error => {
            console.error('Errore Overpass API:', error);
            this.isSearching = false;
            alert('Errore durante la ricerca dei negozi.');
          });
      },
      (error) => {
        this.isSearching = false;
        alert('Attiva il GPS per cercare i negozi vicini.');
      }
    );
  }

  clearStoreMarkers() {
    this.storeMarkers.forEach(marker => this.map.removeLayer(marker));
    this.storeMarkers = [];
  }

  cancelNearbySearch() {
    this.clearStoreMarkers(); 
    this.hasSearchedNearby = false; 
    this.locateUser(); 
  }
 
  // ==========================================
  // LOGICA RICERCA IN TEMPO REALE
  // ==========================================
  async onSearchInput() {
    const query = this.searchQuery.trim();
    
    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    this.isSearchingDb = true;

    try {
      const url = `/api/scanned/search?q=${encodeURIComponent(query)}`;
      const response: any = await lastValueFrom(this.http.get(url, { headers: this.getHeaders() }));

      const uniqueProducts = response.filter((value: any, index: number, self: any[]) =>
        index === self.findIndex((t) => (
          t.barcode === value.barcode
        ))
      );
      
      this.searchResults = uniqueProducts;
    } catch (error) {
      console.error('Errore durante la ricerca nel DB:', error);
      this.searchResults = [];
    } finally {
      this.isSearchingDb = false;
    }
  }

 
  // ==========================================
  // SELEZIONE PRODOTTO E RENDER PIN 
  // ==========================================
  async selectProduct(product: any) {
    this.searchQuery = product.name; 
    this.searchResults = []; 
    this.clearStoreMarkers(); 

    if (!navigator.geolocation) {
      alert('Geolocalizzazione non supportata dal browser. Impossibile calcolare i 10km.');
      return;
    }

    this.isSearchingDb = true;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      const userLatLng = L.latLng(userLat, userLng);

      try {
        const url = `/api/scanned/locations/${product.barcode}`;
        const locations: any = await lastValueFrom(this.http.get(url, { headers: this.getHeaders() }));

        if (locations && locations.length > 0) {
          
          let foundInRadius = false; 

          locations.forEach((loc: any) => {
            if (loc.store && loc.store.coordinates && loc.store.coordinates.lat && loc.store.coordinates.lng) {
              
              const storeLatLng = L.latLng(loc.store.coordinates.lat, loc.store.coordinates.lng);
              const distanceInMeters = userLatLng.distanceTo(storeLatLng);

              if (distanceInMeters <= 10000) {
                foundInRadius = true;

                const formattedPrice = (typeof loc.currentPrice === 'number') 
                                       ? loc.currentPrice.toFixed(2) 
                                       : 'N/D';
                
                const marker = L.marker([loc.store.coordinates.lat, loc.store.coordinates.lng]).addTo(this.map);
                
                const popupContent = `
                  <div style="text-align: center; min-width: 150px;">
                    <strong style="color: #0A1128; font-size: 1.1rem; display: block; margin-bottom: 2px;">${loc.store.name}</strong>
                    <span style="color: #666; font-size: 0.85rem;">${loc.store.address}</span>
                    <div style="margin-top: 10px; background: #e0f7fa; padding: 8px; border-radius: 6px; border: 1px solid #b2ebf2;">
                      <span style="color: #00796b; font-size: 1.3rem; font-weight: 900;">€${formattedPrice}</span>
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                this.storeMarkers.push(marker); 
              }
            }
          });

          if (this.storeMarkers.length > 0) {
            const group = new L.FeatureGroup(this.storeMarkers);
            this.map.fitBounds(group.getBounds().pad(0.2)); 
            
            if (this.storeMarkers.length === 1) {
              this.storeMarkers[0].openPopup();
            }
          }

          if (!foundInRadius) {
            alert(`Abbiamo trovato l'iPhone, ma nessun negozio nel raggio di 10 km da te lo ha attualmente in vendita a sistema.`);
            this.locateUser(); 
          }

        } else {
          alert('Non ci sono ancora prezzi registrati per questo prodotto sulla mappa.');
        }

      } catch (error) {
        console.error('Errore nel recupero delle posizioni:', error);
        alert('Errore di connessione al server.');
      } finally {
        this.isSearchingDb = false;
      }
      
    }, (error) => {
      this.isSearchingDb = false;
      alert('Attiva il GPS per poter cercare i prodotti vicini a te!');
    });
  }

}