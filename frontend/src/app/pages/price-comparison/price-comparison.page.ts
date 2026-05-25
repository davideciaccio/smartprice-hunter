import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ActionSheetController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ComparisonService } from '../../services/comparison.service'; 
import { NoticeService } from 'src/app/services/notices.service';

@Component({
  selector: 'app-price-comparison',
  templateUrl: './price-comparison.page.html',
  styleUrls: ['./price-comparison.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PriceComparisonPage implements OnInit {
  isSidebarActive: boolean = false;
  searchQuery: string = '';
  filteredProducts: any[] = [];
  
  localProducts: any[] = [];
  isLoadingLocal: boolean = true;

  unreadCount: number = 0;

  constructor(
    private comparisonService: ComparisonService,
    private toastCtrl: ToastController,
    private actionSheetController: ActionSheetController, // <-- Aggiunto controller per il sort
    private noticeService: NoticeService
  ) {}

  ngOnInit() {
    this.loadLocalProducts();
    this.noticeService.unreadCount$.subscribe(c => this.unreadCount = c);
    this.noticeService.getNotices().subscribe();
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // ==========================================
  // 1. CARICAMENTO PRODOTTI DAL TUO DATABASE
  // ==========================================
  async loadLocalProducts() {
    this.isLoadingLocal = true;
    try {
      const data = await this.comparisonService.getLocalProducts();
      
      const uniqueProducts = data.filter((value: any, index: number, self: any[]) =>
        index === self.findIndex((t) => (
          (t.barcode && t.barcode === value.barcode) || 
          (!t.barcode && t.name === value.name)
        ))
      );

      this.localProducts = uniqueProducts;
      this.filteredProducts = [...this.localProducts];
      
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
      let query = product.name;

      if (!query || query.trim() === '') {
        query = product.barcode;
      }
      
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

  // ==========================================
  // 3. ELIMINAZIONE PRODOTTO LOCALE
  // ==========================================
  async deleteProduct(productId: string) {
    if (confirm('Sei sicuro di voler eliminare questo prodotto dalle tue rilevazioni?')) {
      try {
        await this.comparisonService.deleteLocalProduct(productId);
        
        // Rimuoviamo istantaneamente sia dalla lista principale che da quella filtrata
        this.localProducts = this.localProducts.filter(p => p._id !== productId);
        this.filteredProducts = this.filteredProducts.filter(p => p._id !== productId);
        
        this.showToast('Prodotto eliminato con successo', 'success');
      } catch (error) {
        console.error(error);
        this.showToast('Errore durante l\'eliminazione', 'danger');
      }
    }
  }

  // ==========================================
  // 4. ORDINAMENTO E RICERCA (Dalla Dashboard)
  // ==========================================
  async presentSortOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Ordina prodotti per prezzo',
      buttons: [
        {
          text: 'Ultimo prodotto aggiunto',
          icon: 'time-outline',
          handler: () => { this.sortProducts('default'); }
        },
        {
          text: 'Prezzo crescente',
          icon: 'arrow-up-outline',
          handler: () => { this.sortProducts('asc'); }
        },
        {
          text: 'Prezzo decrescente',
          icon: 'arrow-down-outline',
          handler: () => { this.sortProducts('desc'); }
        },
        {
          text: 'Annulla',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  sortProducts(order: 'asc' | 'desc' | 'default') {
    if (order === 'default') {
      // Ripristiniamo l'ordine originale e filtriamo di nuovo in caso ci sia testo nella barra
      this.filteredProducts = [...this.localProducts];
      if (this.searchQuery) this.filterProducts();
      
      this.showToast('Prodotti ordinati per data di aggiunta', 'primary');
      return; 
    }

    this.filteredProducts.sort((a, b) => {
      const priceA = a.currentPrice || 0;
      const priceB = b.currentPrice || 0;
      
      if (order === 'asc') return priceA - priceB;
      else return priceB - priceA;
    });

    this.showToast(`Prodotti ordinati per prezzo ${order === 'asc' ? 'crescente' : 'decrescente'}`, 'primary');
  }

  filterProducts() {
    const query = this.searchQuery.toLowerCase().trim();
    
    if (!query) {
      this.filteredProducts = [...this.localProducts];
      return;
    }

    this.filteredProducts = this.localProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.barcode && p.barcode.includes(query))
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredProducts = [...this.localProducts];
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    toast.present();
  }
}