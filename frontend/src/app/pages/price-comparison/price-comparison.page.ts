import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ComparisonService } from '../../services/comparison.service'; // Assicurati che il path sia corretto

@Component({
  selector: 'app-price-comparison',
  templateUrl: './price-comparison.page.html',
  styleUrls: ['./price-comparison.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PriceComparisonPage implements OnInit {
  isSidebarActive: boolean = false;

  // Variabili per gestire i dati
  localProducts: any[] = [];
  isLoadingLocal: boolean = true;

  constructor(
    private comparisonService: ComparisonService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadLocalProducts();
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // ==========================================
  // 1. CARICAMENTO PRODOTTI DAL TUO DATABASE
  // ==========================================
  async loadLocalProducts() {
    this.isLoadingLocal = true;
    try {
      // Chiama la rotta /api/scanned
      const data = await this.comparisonService.getLocalProducts();
      
      // FIX DUPLICATI: Teniamo solo la prima occorrenza per ogni prodotto (basandoci sul barcode o sul nome)
      const uniqueProducts = data.filter((value: any, index: number, self: any[]) =>
        index === self.findIndex((t) => (
          (t.barcode && t.barcode === value.barcode) || 
          (!t.barcode && t.name === value.name)
        ))
      );

      this.localProducts = uniqueProducts;
      
      // TRUCCO UX/UI: Aggiungiamo dinamicamente le proprietà per gestire lo stato della UI
      this.localProducts.forEach(p => {
        p.onlineCompetitors = [];       
        p.isSearchingOnline = false;    
        p.hasSearchedOnline = false;    
      });

    } catch (error) {
      console.error('Errore nel caricamento dei prodotti locali:', error);
      this.showToast('Impossibile caricare i prodotti dal database.', 'danger');
    } finally {
      this.isLoadingLocal = false;
    }
  }

  // ==========================================
  // 2. RICERCA ONLINE "ON-DEMAND" (SERPAPI)
  // ==========================================
  async searchOnline(product: any) {
    if (product.hasSearchedOnline) return;

    product.isSearchingOnline = true; 
    
    try {
      // FIX GOOGLE SHOPPING: Diamo priorità assoluta al NOME del prodotto.
      // Google Shopping è un motore semantico e lavora molto meglio con "Apple iPhone 17 Pro Max" 
      // piuttosto che con un numero "019595...".
      let query = product.name;

      // Se per qualche motivo il nome è vuoto, usiamo il barcode come ruota di scorta
      if (!query || query.trim() === '') {
        query = product.barcode;
      }
      
      // Chiama il nostro controller Node.js
      const competitors = await this.comparisonService.getOnlineCompetitors(query);
      
      product.onlineCompetitors = competitors;
      product.hasSearchedOnline = true;

      if (competitors.length === 0) {
        this.showToast('Nessun competitor online trovato per questo prodotto.', 'warning');
      }

    } catch (error) {
      console.error('Errore durante la ricerca online:', error);
      this.showToast('Errore durante la ricerca dei prezzi online.', 'danger');
      product.hasSearchedOnline = false; 
    } finally {
      product.isSearchingOnline = false; 
    }
  }

  // Utility per i messaggi a schermo
  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}