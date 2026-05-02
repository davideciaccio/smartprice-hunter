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
  newProductUrl: string = ''; // Variabile legata all'input text
  products: any[] = []; // Array che conterrà i prodotti caricati
  isLoading: boolean = false; // Per mostrare uno spinner durante lo scraping

  constructor(
    private productService: ProductService,
    private toastController: ToastController // Per i messaggini a comparsa
  ) {}

  // Questo metodo scatta automaticamente appena si apre la pagina
  ngOnInit() {
    this.loadProducts();
  }

  // 1. Carica i prodotti salvati
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

  // 2. Invia l'URL per lo scraping
  startScraping() {
    if (!this.newProductUrl) {
      this.showToast('Inserisci un URL valido', 'warning');
      return;
    }

    this.isLoading = true; // Mostra "Caricamento in corso..."

    this.productService.addProduct(this.newProductUrl).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.newProductUrl = ''; // Svuota la barra
        this.showToast('Prodotto aggiunto con successo!', 'success');
        this.loadProducts(); // Ricarica la lista per mostrare il nuovo arrivato
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.showToast('Errore durante l\'analisi del link', 'danger');
      }
    });
  }

  // Metodo di utilità per mostrare i bannerini colorati in basso
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}