import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProductService } from 'src/app/services/product'; 
import { Chart, registerables } from 'chart.js';
import { NoticeService } from 'src/app/services/notices.service';

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
  
  searchQuery: string = '';
  products: any[] = [];
  originalProducts: any[] = [];

  isModalOpen: boolean = false;
  selectedProduct: any = null;
  modalChart: any = null;

  unreadCount: number = 0;
  
  charts: { [key: string]: Chart } = {};

  constructor(private productService: ProductService, private noticeService: NoticeService) {}

  ngOnInit() {
    this.loadProducts();
    this.noticeService.unreadCount$.subscribe(c => this.unreadCount = c);
    this.noticeService.getNotices().subscribe();
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  loadProducts() {
    this.productService.getUserProducts().subscribe({
      next: (data) => {
        this.products = [...data];
        this.originalProducts = [...data];
        
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
    setTimeout(() => this.renderMiniCharts(), 200);
  }

  clearSearch() {
    this.searchQuery = '';
    this.products = [...this.originalProducts];
    setTimeout(() => this.renderMiniCharts(), 200);
  }

  segmentColorConfig = {
    borderColor: (ctx: any) => {
      if (!ctx.p0 || !ctx.p1) return 'rgba(10, 17, 40, 0.2)';
      const prev = ctx.p0.parsed.y;
      const curr = ctx.p1.parsed.y;
      if (curr > prev) return '#d9534f'; 
      if (curr < prev) return '#5cb85c'; 
      return 'rgba(10, 17, 40, 0.2)';    
    }
  };

  renderMiniCharts() {
    this.products.forEach(product => {
      const canvasId = 'chart-' + product._id;
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      
      if (!canvas || !product.priceHistory) return;

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
            x: { display: false }, 
            y: { display: false }  
          }
        }
      });
    });
  }

  openChartModal(product: any) {
    this.selectedProduct = product;
    this.isModalOpen = true;

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
                color: '#b0b0b0',
                font: { size: 11 }
              },
              grid: {
                display: true,
                color: '#e0e0e0', 
                drawTicks: false
              }
            },
            y: { 
              display: true, 
              beginAtZero: false,
              ticks: {
                color: '#b0b0b0', 
                font: { size: 11 }
              },
              grid: {
                display: true,
                color: '#e0e0e0', 
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