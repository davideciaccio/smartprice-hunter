import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ProductService } from 'src/app/services/product';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DashboardPage implements OnInit {
  newProductUrl: string = ''; 
  products: any[] = []; 
  isLoading: boolean = false; 

  isSidebarActive: boolean = false; 

  constructor(
    private productService: ProductService,
    private toastController: ToastController 
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
        this.products = data;
      },
      error: (err) => {
        console.error('Errore caricamento prodotti:', err);
        this.showToast('Errore nel caricamento dei dati', 'danger');
      }
    });
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
          
          // 4. Mostra banner di successo
          this.showToast('Prodotto eliminato con successo', 'success');
        },
        error: (err) => {
          console.error('Errore durante l\'eliminazione:', err);
          this.showToast('Errore durante l\'eliminazione del prodotto', 'danger');
        }
      });
    }
  }
}