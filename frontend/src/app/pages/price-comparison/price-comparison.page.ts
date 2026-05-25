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
    private actionSheetController: ActionSheetController, 
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
  // 1. CARICAMENTO E RAGGRUPPAMENTO PRODOTTI
  // ==========================================
  async loadLocalProducts() {
    this.isLoadingLocal = true;
    try {
      const data = await this.comparisonService.getLocalProducts();
      
      // Creiamo una mappa per raggruppare i prodotti con lo stesso EAN/Nome
      const groupedMap = new Map<string, any>();

      data.forEach((item: any) => {
        const key = item.barcode || item.name;
        
        if (!groupedMap.has(key)) {
          // Primo incontro con questo prodotto: lo prepariamo
          groupedMap.set(key, {
            ...item,
            locations: [{ 
              _id: item._id, 
              store: item.store, 
              price: item.currentPrice,
              date: item.updatedAt || item.createdAt
            }],
            isDropdownOpen: false
          });
        } else {
          // Trovato duplicato (stesso utente, store diverso): aggiungiamo la location
          const existing = groupedMap.get(key);
          existing.locations.push({
            _id: item._id,
            store: item.store,
            price: item.currentPrice,
            date: item.updatedAt || item.createdAt
          });
        }
      });

      // Trasformiamo la mappa in array e stabiliamo l'ordinamento delle tendine
      this.localProducts = Array.from(groupedMap.values()).map(product => {
        // Ordiniamo i negozi dal più recente al più vecchio
        product.locations.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Impostiamo come "attivo" il negozio scansionato per ultimo
        const latest = product.locations[0];
        product._id = latest._id;
        product.store = latest.store;
        product.currentPrice = latest.price;
        
        product.onlineCompetitors = [];
        product.isSearchingOnline = false;
        product.hasSearchedOnline = false;
        
        return product;
      });

      this.filteredProducts = [...this.localProducts];

    } catch (error) {
      console.error('Errore nel caricamento dei prodotti locali:', error);
      this.showToast('Impossibile caricare i prodotti dal database.', 'danger');
    } finally {
      this.isLoadingLocal = false;
    }
  }

  // ==========================================
  // GESTIONE TENDINA NEGOZI (NUOVO)
  // ==========================================
  toggleDropdown(product: any) {
    // Chiude le altre tendine e inverte lo stato di questa
    this.filteredProducts.forEach(p => { if (p !== product) p.isDropdownOpen = false; });
    product.isDropdownOpen = !product.isDropdownOpen;
  }

  selectLocation(product: any, loc: any) {
    product._id = loc._id;
    product.store = loc.store;
    product.currentPrice = loc.price;
    product.isDropdownOpen = false; // Chiudiamo la tendina
  }

  // ==========================================
  // 2. RICERCA ONLINE "ON-DEMAND"
  // ==========================================
  async searchOnline(product: any) {
    if (product.hasSearchedOnline) return;

    product.isSearchingOnline = true; 
    
    try {
      let query = product.name;
      if (!query || query.trim() === '') query = product.barcode;
      
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
  // 3. ELIMINAZIONE PRODOTTO SCANSIONATO
  // ==========================================
  async deleteProduct(product: any) {
    if (confirm(`Sei sicuro di voler eliminare la rilevazione da ${product.store.name}?`)) {
      try {
        await this.comparisonService.deleteLocalProduct(product._id);
        
        // Rimuoviamo la singola location dall'array del prodotto
        product.locations = product.locations.filter((loc: any) => loc._id !== product._id);
        
        if (product.locations.length === 0) {
          // Era l'unica location rimasta: scompare l'intero prodotto dalla lista
          this.localProducts = this.localProducts.filter(p => p !== product);
          this.filteredProducts = this.filteredProducts.filter(p => p !== product);
        } else {
          // C'erano altre location: switchiamo automaticamente al negozio precedente
          const nextLoc = product.locations[0];
          product._id = nextLoc._id;
          product.store = nextLoc.store;
          product.currentPrice = nextLoc.price;
        }
        
        this.showToast('Rilevazione eliminata con successo', 'success');
      } catch (error) {
        console.error(error);
        this.showToast('Errore durante l\'eliminazione', 'danger');
      }
    }
  }

  // ==========================================
  // 4. ORDINAMENTO E RICERCA
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
      p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.includes(query))
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