import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

// FIX: Importiamo i moduli corretti dal nuovo plugin ufficiale
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CameraPage {
  isSidebarActive: boolean = false; 
  manualBarcode: string = '';

  constructor() {}

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // ==========================================
  // GESTIONE SCANNER (PLUGIN UFFICIALE CAPACITOR)
  // ==========================================
  async startScan() {
    try {
      // Il plugin apre la sua fotocamera nativa e aspetta la lettura
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL // Cerca tutti i tipi di barcode (EAN, QR, ecc.)
      });

      // Se l'utente inquadra un codice (e non chiude la fotocamera prima)
      if (result && result.ScanResult) {
        console.log('BARCODE SCANSIONATO:', result.ScanResult);
        alert(`Hai inquadrato: ${result.ScanResult}`);
        // Qui in futuro potrai chiamare l'API per aggiungere il prodotto!
      }
    } catch (error) {
      // Viene eseguito se l'utente annulla la scansione o c'è un errore
      console.error('Scansione annullata o fallita:', error);
    }
  }

  // ==========================================
  // INSERIMENTO MANUALE (SIMULAZIONE EAN_13)
  // ==========================================
  submitManualBarcode() {
    if (this.manualBarcode.trim() !== '') {
      
      // 1. Creiamo l'oggetto esatto che Capacitor restituisce per un EAN
      const mockResult = {
        ScanResult: this.manualBarcode, // Prende i numeri che hai digitato
        Format: 'EAN_13'                // Formato standard dei prodotti commerciali
      };

      // 2. Logica di debug in console
      console.log('--- TEST: SCANSIONE EAN COMPLETATA ---');
      console.log('Oggetto grezzo dal plugin:', mockResult);
      
      // 3. Esempio di logica reale che faresti dopo la scansione
      if (mockResult.Format === 'EAN_13' || mockResult.Format === 'EAN_8') {
        console.log(`✅ Codice EAN valido rilevato: ${mockResult.ScanResult}`);
        alert(`Scansione EAN completata: ${mockResult.ScanResult}\nOra posso cercare il prodotto nel DB!`);
        
        // QUI IN FUTURO: 
        // this.productService.searchByEan(mockResult.ScanResult).subscribe(...)
      } else {
        console.warn(`⚠️ Attenzione: il codice scansionato non è un EAN (Formato: ${mockResult.Format})`);
        alert('Per favore, inquadra il codice a barre di un prodotto valido.');
      }

      console.log('---------------------------------------');

      // 4. Pulisci l'input
      this.manualBarcode = '';
    }
  }
}