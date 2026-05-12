import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActionSheetController, IonicModule, ToastController } from '@ionic/angular';
import { ProductService } from 'src/app/services/product';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DashboardPage implements OnInit {
  newProductUrl: string = ''; 
  searchQuery : string = '';
  products: any[] = []; //Prodotti visualizzati 
  originalProducts: any[] = []; // Memorizza l'ordine originale dei prodotti
  today: Date = new Date();
  isLoading: boolean = false; 
  isSidebarActive: boolean = false; 
  totalProducts: number = 0;
  changesToday: number = 0;
  changesWeek: number = 0;

  constructor(
    private productService: ProductService,
    private toastController: ToastController, 
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  toggleSidebar() {
    this.isSidebarActive = !this.isSidebarActive;
  }

  closeSidebar() {
    this.isSidebarActive = false;
  }

  loadProducts() {
    this.productService.getUserProducts().subscribe({
      next: (data) => {
        this.products = [...data];
        this.originalProducts = [...data];
        this.calculateStats();
      },
      error: (err) => {
        console.error('Errore caricamento prodotti:', err);
        this.showToast('Errore nel caricamento dei dati', 'danger');
      }
    });
  }

  // 2. Logica di ricerca (per nome, case-insensitive)
  filterProducts() {
    const query = this.searchQuery.toLowerCase().trim();
    
    if (!query) {
      this.products = [...this.originalProducts];
      return;
    }

    this.products = this.originalProducts.filter(product => 
      product.name.toLowerCase().includes(query)
    );
  }

  // 3. Pulisce la ricerca e ripristina la tabella
  clearSearch() {
    this.searchQuery = '';
    this.products = [...this.originalProducts];
  }

  startScraping() {
    if (!this.newProductUrl) {
      this.showToast('Inserisci un URL valido', 'warning');
      return;
    }

    this.isLoading = true; 

    this.productService.addProduct(this.newProductUrl).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.newProductUrl = ''; 
        this.showToast('Prodotto aggiunto con successo!', 'success');
        this.loadProducts(); 
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.showToast('Errore durante l\'analisi del link', 'danger');
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  // ==========================================
  // METODO PER ELIMINARE UN PRODOTTO
  // ==========================================
  deleteProduct(productId: string) {
    // 1. Chiede conferma prima di procedere
    if (confirm('Sei sicuro di voler smettere di monitorare questo prodotto?')) {
      
      // 2. Chiama il backend per eliminarlo dal Database
      this.productService.deleteProduct(productId).subscribe({
        next: () => {
          // 3. Se il db risponde OK, eliminiamo il prodotto dall'array locale
          // Questo farà sparire la riga dalla tabella istantaneamente senza ricaricare la pagina!
          this.products = this.products.filter(p => p._id !== productId);
          // NUOVA: Rimuoviamo il prodotto anche dalla copia di backup
          this.originalProducts = this.originalProducts.filter(p => p._id !== productId);
          // 4. Mostra banner di successo
          this.showToast('Prodotto eliminato con successo', 'success');
          this.calculateStats();
        },
        error: (err) => {
          console.error('Errore durante l\'eliminazione:', err);
          this.showToast('Errore durante l\'eliminazione del prodotto', 'danger');
        }
      });
    }
  }

  // ==========================================
  // METODO PER CALCOLARE LA VARIAZIONE PREZZO
  // ==========================================
  getVariationData(product: any) {
    // 1. Se non c'è lo storico o c'è un solo prezzo, restituisci false
    if (!product.priceHistory || product.priceHistory.length < 2) {
      return { hasVariation: false, isFlat: false };
    }

    const history = product.priceHistory;
    // 2. Recuperiamo gli ultimi due prezzi
    const currentPrice = history[history.length - 1].price;
    const previousPrice = history[history.length - 2].price;

    // 3. Calcolo differenza e percentuale
    const diff = currentPrice - previousPrice;
    const percentage = (diff / previousPrice) * 100;
    
    // Formattiamo il valore a 1 decimale
    const formattedValue = Math.abs(percentage).toFixed(1);

    // FIX: Se non c'è differenza o la variazione è talmente minuscola da arrotondarsi a 0.0
    if (diff === 0 || formattedValue === '0.0') {
      return {
        hasVariation: true,
        isFlat: true, // NUOVO STATO: Invariato
        value: '0.0%'
      };
    }

    // 4. Restituiamo i dati per l'HTML (Salito o Sceso)
    return {
      hasVariation: true,
      isFlat: false,
      isIncrease: diff > 0, // Se diff è maggiore di 0 il prezzo è salito
      value: formattedValue + '%'
    };
  }

  // 1. Mostra il menu di scelta (Action Sheet)
  async presentSortOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Ordina prodotti per prezzo',
      buttons: [
        {
          text: 'Ultimo prodotto aggiunto',
          icon: 'time-outline', // Un'icona a forma di orologio
          handler: () => {
            this.sortProducts('default');
          }
        },
        {
          text: 'Prezzo crescente',
          icon: 'arrow-up-outline',
          handler: () => {
            this.sortProducts('asc');
          }
        },
        {
          text: 'Prezzo decrescente',
          icon: 'arrow-down-outline',
          handler: () => {
            this.sortProducts('desc');
          }
        },
        {
          text: 'Annulla',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // 2. Logica che ordina l'array e ricarica la tabella
  sortProducts(order: 'asc' | 'desc' | 'default') {

    if (order === 'default') {
      this.products = [...this.originalProducts];
      this.showToast('Prodotti ordinati per data di aggiunta', 'primary');
      return; // Interrompiamo la funzione qui
    }

    this.products.sort((a, b) => {
      // Se il prezzo manca (N/D), lo consideriamo come 0 per l'ordinamento
      const priceA = a.currentPrice || 0;
      const priceB = b.currentPrice || 0;
      
      if (order === 'asc') {
        return priceA - priceB;
      } else {
        return priceB - priceA;
      }
    });

    // Opzionale: un piccolo feedback all'utente
    this.showToast(`Prodotti ordinati per prezzo ${order === 'asc' ? 'crescente' : 'decrescente'}`, 'primary');
  }

  calculateStats() {
    // 1. Conteggio totale prodotti
    this.totalProducts = this.originalProducts.length;

    const now = new Date();
    // Inizio di oggi (ore 00:00:00)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Una settimana fa
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let countToday = 0;
    let countWeek = 0;

    this.originalProducts.forEach(product => {
      if (product.priceHistory && product.priceHistory.length > 1) {
        // Iteriamo sullo storico (saltando il primo elemento che è il prezzo di creazione)
        product.priceHistory.slice(1).forEach((entry: any) => {
          const entryDate = new Date(entry.date);
          
          if (entryDate >= todayStart) {
            countToday++;
          }
          if (entryDate >= weekAgo) {
            countWeek++;
          }
        });
      }
    });

    this.changesToday = countToday;
    this.changesWeek = countWeek;
  }

}