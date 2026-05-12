import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';

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
  private storeMarkers: any[] = []; // Salva i pin dei negozi per poterli cancellare
  hasSearchedNearby: boolean = false;
  
  private map: any;
  private userMarker: any; // Mantiene in memoria l'indicatore rosso

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

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
}