import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-price-comparison',
  templateUrl: './price-comparison.page.html',
  styleUrls: ['./price-comparison.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PriceComparisonPage implements OnInit {
  // Gestione UI Sidebar responsiva
  isSidebarActive: boolean = false; 

  constructor() {}

  ngOnInit() {}

  toggleSidebar() { 
    this.isSidebarActive = !this.isSidebarActive; 
  }
  
  closeSidebar() { 
    this.isSidebarActive = false; 
  }
}