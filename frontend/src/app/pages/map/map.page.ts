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
}