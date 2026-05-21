import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // IMPORTANTE: Aggiunto HttpClient
import { lastValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { AuthService } from '../../services/auth';

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
  
  // NUOVE VARIABILI PER LA TENDINA
  searchResults: any[] = []; 
  isSearchingDb: boolean = false;

  private map: any;
  private userMarker: any;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // 3. USA IL TOKEN DALL'AUTH SERVICE
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
      // Trova l'utente automaticamente appena la mappa si carica!
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

        // Sposta fluidamente la visuale della mappa sulla posizione (zoom livello 14)
        this.map.flyTo([lat, lng], 14, {
          animate: true,
          duration: 1.5
        });

        // Rimuove il vecchio indicatore se stiamo ricaricando la posizione
        if (this.userMarker) {
          this.map.removeLayer(this.userMarker);
        }

        // Crea un indicatore rosso moderno (Cerchio per evitare problemi con icone esterne)
        this.userMarker = L.circleMarker([lat, lng], {
          radius: 9,
          fillColor: '#d9534f', // Colore Rosso
          color: '#ffffff',     // Bordo bianco spesso per far risaltare il punto sulla mappa
          weight: 3,
          fillOpacity: 1
        }).addTo(this.map);

        // Aggiunge la scritta "Tu sei qui!" e la apre in automatico
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

    this.clearStoreMarkers(); // Rimuove i marker dei negozi
    this.locateUser(); // Riporta lo zoom e il focus sulla posizione GPS dell'utente
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
        const radius = 10000; // 10 km in metri

        // Query Overpass QL per cercare negozi di elettronica nel raggio di 10km
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
            this.clearStoreMarkers(); // Pulisce vecchi risultati

            if (!data.elements || data.elements.length === 0) {
              alert('Nessun negozio di elettronica trovato nel raggio di 10 km.');
              return;
            }

            // Ricerca completata con successo: mostra il tasto annulla
            this.hasSearchedNearby = true;

            // Disegna i pin sulla mappa
            data.elements.forEach((element: any) => {
              // Overpass restituisce lat/lon direttamente per i "node", o in "center" per le "way"
              const elLat = element.lat || element.center.lat;
              const elLng = element.lon || element.center.lon;
              const name = element.tags?.name || 'Negozio di Elettronica';

              // Usa il marker standard di Leaflet per i negozi
              const marker = L.marker([elLat, elLng]).addTo(this.map);
              
              // Aggiunge un popup con il nome del negozio
              marker.bindPopup(`<strong style="color: #0A1128;">${name}</strong>`);
              this.storeMarkers.push(marker);
            });

            // Adatta lo zoom per mostrare tutti i risultati trovati
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

  // ==========================================
  // NUOVO: ANNULLA RICERCA NEGOZI
  // ==========================================
  cancelNearbySearch() {
    this.clearStoreMarkers(); // Rimuove i pin azzurri
    this.hasSearchedNearby = false; // Nasconde questo bottone
    this.locateUser(); // Riporta la visuale sul "Tu sei qui" dell'utente
  }
 
  // ==========================================
  // NUOVO: LOGICA RICERCA IN TEMPO REALE
  // ==========================================
  async onSearchInput() {
    const query = this.searchQuery.trim();
    
    // Se l'utente ha cancellato il testo o scritto meno di 2 caratteri, nascondi la tendina
    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    this.isSearchingDb = true;

    try {
      // Chiama il tuo backend Node.js
      const url = `http://localhost:3000/api/scanned/search?q=${encodeURIComponent(query)}`;
      const response: any = await lastValueFrom(this.http.get(url, { headers: this.getHeaders() }));

      // Teniamo solo la prima occorrenza per ogni codice a barre
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
  // SELEZIONE PRODOTTO E RENDER PIN (FIX 10KM)
  // ==========================================
  async selectProduct(product: any) {
    this.searchQuery = product.name; 
    this.searchResults = []; 
    this.clearStoreMarkers(); 

    // Verifichiamo che il GPS sia attivo, altrimenti non possiamo calcolare la distanza
    if (!navigator.geolocation) {
      alert('Geolocalizzazione non supportata dal browser. Impossibile calcolare i 10km.');
      return;
    }

    this.isSearchingDb = true;

    // Otteniamo la posizione dell'utente
    navigator.geolocation.getCurrentPosition(async (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      // Creiamo l'oggetto Coordinate di Leaflet per l'utente
      const userLatLng = L.latLng(userLat, userLng);

      try {
        const url = `http://localhost:3000/api/scanned/locations/${product.barcode}`;
        const locations: any = await lastValueFrom(this.http.get(url, { headers: this.getHeaders() }));

        if (locations && locations.length > 0) {
          
          let foundInRadius = false; // Variabile per capire se abbiamo trovato qualcosa vicino

          locations.forEach((loc: any) => {
            if (loc.store && loc.store.coordinates && loc.store.coordinates.lat && loc.store.coordinates.lng) {
              
              // Creiamo l'oggetto Coordinate per il negozio
              const storeLatLng = L.latLng(loc.store.coordinates.lat, loc.store.coordinates.lng);
              
              // TASK 2 FIX: Calcoliamo la distanza in metri tra l'utente e il negozio
              const distanceInMeters = userLatLng.distanceTo(storeLatLng);

              // Se il negozio è entro i 10.000 metri (10km), lo disegniamo!
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

          // Mostriamo i pin sulla mappa
          if (this.storeMarkers.length > 0) {
            const group = new L.FeatureGroup(this.storeMarkers);
            this.map.fitBounds(group.getBounds().pad(0.2)); 
            
            if (this.storeMarkers.length === 1) {
              this.storeMarkers[0].openPopup();
            }
          }

          // Se il DB aveva il prodotto, ma nessun negozio era nel raggio di 10km:
          if (!foundInRadius) {
            alert(`Abbiamo trovato l'iPhone, ma nessun negozio nel raggio di 10 km da te lo ha attualmente in vendita a sistema.`);
            // Riportiamo la mappa sull'utente
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