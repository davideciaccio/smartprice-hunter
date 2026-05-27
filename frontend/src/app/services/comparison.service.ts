import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  // L'URL base del tuo backend Node.js
  private baseUrl = '/api';

  constructor(private http: HttpClient) { }


  // 2. Metodo privato per creare gli headers con il token
  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Il formato standard per i token JWT
    });
  }
  /**
   * 1. RECUPERO PRODOTTI LOCALI
   * Chiama il tuo DB per ottenere la lista dei prodotti scansionati fisicamente
   * (Assumiamo che tu abbia una rotta GET /api/scanned per prendere tutti i prodotti. 
   * Se non ce l'hai o ha un nome diverso, adatta l'URL qui sotto).
   */
  async getLocalProducts() {
    const url = `${this.baseUrl}/scanned`; 
    try {
      const response = await lastValueFrom(this.http.get<any[]>(url, { headers: this.getHeaders() }));
      return response;
    } catch (error) {
      console.error('Errore nel recupero dei prodotti locali:', error);
      throw error;
    }
  }

  /**
   * 2. RECUPERO COMPETITOR ONLINE (Il ponte verso SerpApi)
   * Chiama la rotta sicura che abbiamo creato in Node.js nella Fase 1
   * @param query Il barcode o il nome del prodotto (es. '0195950638462' o 'iPhone 15')
   */
  async getOnlineCompetitors(query: string) {
    const url = `${this.baseUrl}/compare/${encodeURIComponent(query)}`;
    try {
      // Il backend Node.js farà il lavoro sporco con SerpApi e ci restituirà l'array di 5 elementi puliti
      const response = await lastValueFrom(this.http.get<any[]>(url, { headers: this.getHeaders() }));
      return response;
    } catch (error) {
      console.error('Errore nel recupero dei competitor online:', error);
      throw error;
    }
  }

  async deleteLocalProduct(productId: string) {
    const url = `${this.baseUrl}/scanned/${productId}`;
    try {
      const response = await lastValueFrom(this.http.delete(url, { headers: this.getHeaders() }));
      return response;
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
      throw error;
    }
  }
}