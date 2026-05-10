import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProductService } from 'src/app/services/product'; // Assicurati che il percorso sia corretto
import { Chart, registerables } from 'chart.js';

// Registra i componenti di Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-price-history',
  templateUrl: './price-history.page.html',
  styleUrls: ['./price-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PriceHistoryPage implements OnInit {
  isSidebarActive: boolean = false; 
  
  // Variabili per la ricerca
  searchQuery: string = '';
  products: any[] = [];
  originalProducts: any[] = [];

  // Variabili per il grafico modale
  isModalOpen: boolean = false;
  selectedProduct: any = null;
  modalChart: any = null;
  
  // Memorizza i grafici attivi per poterli distruggere prima di ricrearli
  charts: { [key: string]: Chart } = {};

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  // ==========================================
  // SIDEBAR LOGIC
  // ==========================================
  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // ==========================================
  // CARICAMENTO E RICERCA
  // ==========================================
  loadProducts() {
    this.productService.getUserProducts().subscribe({
      next: (data) => {
        this.products = [...data];
        this.originalProducts = [...data];
        
        // Disegna i grafici in miniatura dopo che l'HTML si è aggiornato
        setTimeout(() => this.renderMiniCharts(), 200);
      },
      error: (err) => console.error('Errore', err)
    });
  }

  filterProducts() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.products = [...this.originalProducts];
    } else {
      this.products = this.originalProducts.filter(product => 
        product.name.toLowerCase().includes(query)
      );
    }
    // Ridisegna i grafici per i prodotti filtrati
    setTimeout(() => this.renderMiniCharts(), 200);
  }

  clearSearch() {
    this.searchQuery = '';
    this.products = [...this.originalProducts];
    setTimeout(() => this.renderMiniCharts(), 200);
  }

  // ==========================================
  // LOGICA GRAFICI (CHART.JS)
  // ==========================================
  
  // Colora i segmenti della linea in base alla pendenza
  segmentColorConfig = {
    borderColor: (ctx: any) => {
      if (!ctx.p0 || !ctx.p1) return 'rgba(10, 17, 40, 0.2)';
      const prev = ctx.p0.parsed.y;
      const curr = ctx.p1.parsed.y;
      if (curr > prev) return '#d9534f'; // Sale -> Rosso
      if (curr < prev) return '#5cb85c'; // Scende -> Verde
      return 'rgba(10, 17, 40, 0.2)';    // Stabile -> Grigio neutro
    }
  };

  renderMiniCharts() {
    this.products.forEach(product => {
      const canvasId = 'chart-' + product._id;
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      
      if (!canvas || !product.priceHistory) return;

      // Se esiste già un grafico per questo prodotto, lo distruggiamo
      if (this.charts[product._id]) {
        this.charts[product._id].destroy();
      }

      const labels = product.priceHistory.map((entry: any) => new Date(entry.date).toLocaleDateString());
      const dataPoints = product.priceHistory.map((entry: any) => entry.price);

      this.charts[product._id] = new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: dataPoints,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.1, // Linea leggermente tesa
            segment: this.segmentColorConfig
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` Prezzo: €${context.parsed.y}`
              }
            }
          },
          scales: {
            x: { display: false }, 
            y: { display: false }  
          }
        }
      });
    });
  }

  // ==========================================
  // MODALE GRAFICO ESPANSO
  // ==========================================
  openChartModal(product: any) {
    this.selectedProduct = product;
    this.isModalOpen = true;

    // Disegna il grafico grande dopo che la modale si è aperta
    setTimeout(() => {
      const canvas = document.getElementById('modalCanvas') as HTMLCanvasElement;
      if (!canvas) return;

      if (this.modalChart) this.modalChart.destroy();

      const labels = product.priceHistory.map((entry: any) => new Date(entry.date).toLocaleDateString());
      const dataPoints = product.priceHistory.map((entry: any) => entry.price);

      this.modalChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Andamento Prezzo (€)',
            data: dataPoints,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.1,
            segment: this.segmentColorConfig
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` Prezzo: €${context.parsed.y}`
              }
            }
          },
          scales: {
            x: { 
              display: true,
              ticks: {
                color: '#b0b0b0', // Date in grigio chiaro
                font: { size: 11 }
              },
              grid: {
                display: true,
                color: '#e0e0e0', // Linee verticali grigio chiaro
                drawTicks: false
              }
            },
            y: { 
              display: true, 
              beginAtZero: false,
              ticks: {
                color: '#b0b0b0', // Prezzi in grigio chiaro
                font: { size: 11 }
              },
              grid: {
                display: true,
                color: '#e0e0e0', // Linee orizzontali grigio chiaro
                drawTicks: false
              }
            }
          }
        }
      });
    }, 300);
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedProduct = null;
    if (this.modalChart) {
      this.modalChart.destroy();
      this.modalChart = null;
    }
  }
}