import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router'; // Fondamentale per i link

@Component({
  selector: 'app-camera', // Lascia quello generato da Ionic
  templateUrl: './camera.page.html', // Lascia quello generato da Ionic
  styleUrls: ['./camera.page.scss'], // Lascia quello generato da Ionic
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CameraPage implements OnInit { // Usa la classe generata da Ionic
  
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