import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router'; // Fondamentale per i link

@Component({
  selector: 'app-map', // Lascia quello generato da Ionic
  templateUrl: './map.page.html', // Lascia quello generato da Ionic
  styleUrls: ['./map.page.scss'], // Lascia quello generato da Ionic
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class MapPage implements OnInit { // Usa la classe generata da Ionic
  
  // Variabile per gestire l'apertura del menu su cellulare
  isSidebarActive: boolean = false; 

  constructor() {}

  ngOnInit() {}

  // Logica della Sidebar Mobile
  toggleSidebar() {
    this.isSidebarActive = !this.isSidebarActive;
  }

  closeSidebar() {
    this.isSidebarActive = false;
  }
}