import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

// Plugin ufficiale Capacitor
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CameraPage implements OnInit {
  // Gestione UI Sidebar
  isSidebarActive: boolean = false; 
  manualBarcode: string = '';

  // Gestione dello stato del Wizard
  step: 'scan' | 'found' | 'price' | 'store' = 'scan';
  
  // Dati del prodotto che stiamo costruendo passo dopo passo
  scannedProduct: any = {};
  
  // Variabili per la mappa e la ricerca negozi
  nearbyStores: any[] = [];
  filteredStores: any[] = [];
  isLoadingStores: boolean = false;

  constructor(private http: HttpClient, private toastCtrl: ToastController) {}

  ngOnInit() {}

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // ==========================================
  // STEP 1: SCANSIONE REALE (CAPACITOR)
  // ==========================================
  async startScan() {
    try {
      // Apre la fotocamera nativa del dispositivo
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL
      });

      if (result && result.ScanResult) {
        console.log('BARCODE SCANSIONATO:', result.ScanResult);
        // Passiamo il codice alla funzione di ricerca
        this.lookupProduct(result.ScanResult);
      }
    } catch (error) {
      console.error('Scansione annullata o fallita:', error);
    }
  }

  // ==========================================
  // STEP 1B: INSERIMENTO MANUALE
  // ==========================================
  submitManualBarcode() {
    if (this.manualBarcode.trim() !== '') {
      console.log(`✅ Codice EAN manuale inserito: ${this.manualBarcode}`);
      this.lookupProduct(this.manualBarcode);
      this.manualBarcode = ''; // Reset input
    }
  }


  // ==========================================
  // STEP 2: RICERCA PRODOTTO (DB LOCALE O API)
  // ==========================================
  async lookupProduct(barcode: string) {
    try {
      this.showToast('Ricerca prodotto...', 'medium');

      const apiUrl = `http://localhost:3000/api/scanned/lookup/${barcode}`;
      const response: any = await lastValueFrom(this.http.get(apiUrl));

      // CASO A: Il backend ha trovato il prodotto nel TUO database
      if (response && response.foundInDb) {
        this.showToast('Prodotto trovato nel nostro archivio!', 'success');
        
        // Mappiamo i dati dal tuo DB
        this.scannedProduct = {
          name: response.data.name || 'Nome non disponibile',
          barcode: barcode,
          brand: response.data.brand || 'Marca generica',
          image: response.data.image || 'https://via.placeholder.com/300x250?text=Nessuna+Foto',
          isExisting: true // Flag opzionale per ricordarci che era già nel DB
        };
        this.step = 'found';
      } 
      // CASO B: Il backend NON lo aveva, ma l'ha trovato su UPCitemdb
      else if (response && response.code === 'OK' && response.items && response.items.length > 0) {
        const productData = response.items[0];
        
        // Mappiamo i dati da UPCitemdb
        this.scannedProduct = {
          name: productData.title || 'Nome Prodotto non specificato',
          barcode: barcode,
          brand: productData.brand || 'Marca generica',
          image: (productData.images && productData.images.length > 0) 
                 ? productData.images[0] 
                 : 'https://via.placeholder.com/300x250?text=Foto+Non+Disponibile'
        };
        this.step = 'found';
      } 
      // CASO C: Prodotto non trovato da nessuna parte
      else {
        this.showToast('Prodotto non trovato. Prova con un altro codice.', 'warning');
      }

    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      this.showToast('Errore di connessione al server.', 'danger');
    }
  }

  goToPrice() {
    this.step = 'price';
  }

  // ==========================================
  // STEP 3 e 4: PREZZO E NEGOZI VICINI
  // ==========================================
  goToStoreSelection() {
    if (!this.scannedProduct.price || this.scannedProduct.price <= 0) {
      this.showToast('Inserisci un prezzo valido', 'warning');
      return;
    }
    this.step = 'store';
    this.loadNearbyStores();
  }

  async loadNearbyStores() {
    this.isLoadingStores = true;

    if (!navigator.geolocation) {
      this.isLoadingStores = false;
      this.showToast('Geolocalizzazione non supportata dal browser.', 'danger');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Overpass API: Cerchiamo negozi entro 10km (10000 metri)
      const query = `
        [out:json];
        (
          node["shop"="electronics"](around:10000,${lat},${lon});
          node["shop"="computer"](around:10000,${lat},${lon});
          node["shop"="mobile_phone"](around:10000,${lat},${lon});
          node["shop"="supermarket"](around:10000,${lat},${lon});
        );
        out body;
      `;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

      try {
        const response: any = await lastValueFrom(this.http.get(url));
        
        this.nearbyStores = response.elements.map((el: any) => ({
          name: el.tags?.name || 'Negozio Senza Nome',
          lat: el.lat,
          lng: el.lon,
          address: el.tags?.['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : 'Indirizzo non specificato'
        })).filter((store: any) => store.name !== 'Negozio Senza Nome');

        this.filteredStores = [...this.nearbyStores];
      } catch (error) {
        console.error("Errore recupero negozi:", error);
        this.showToast('Errore nel recupero dei negozi vicini', 'danger');
      } finally {
        this.isLoadingStores = false;
      }
    }, (err) => {
      this.isLoadingStores = false;
      this.showToast('Attiva il GPS per trovare i negozi vicini!', 'danger');
    }, { enableHighAccuracy: true });
  }

  filterStores(event: any) {
    const term = event.target.value.toLowerCase();
    this.filteredStores = this.nearbyStores.filter(store => 
      store.name.toLowerCase().includes(term) || store.address.toLowerCase().includes(term)
    );
  }

  // ==========================================
  // STEP 5: SALVATAGGIO A DATABASE
  // ==========================================
  async selectStoreAndSave(selectedStore: any) {
    this.scannedProduct.store = selectedStore;
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    try {
      // Invia il prodotto al backend (la rotta che abbiamo creato prima!)
      await lastValueFrom(this.http.post('http://localhost:3000/api/scanned/save', this.scannedProduct, { headers }));
      
      this.showToast('Prodotto salvato con successo!', 'success');
      
      // Reset del Wizard per una nuova scansione
      this.step = 'scan';
      this.scannedProduct = {};
    } catch (error) {
      console.error(error);
      this.showToast('Errore durante il salvataggio', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    toast.present();
  }
}