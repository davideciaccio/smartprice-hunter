import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // L'indirizzo del nostro backend Node.js
  private apiUrl = '/api/products';

  constructor(private http: HttpClient) { }

  // Metodo privato per creare gli Header della richiesta, inserendo il Token!
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Recupera la "chiave magnetica"
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Il lasciapassare per il nostro authMiddleware
    });
  }

  // 1. Chiamata POST per aggiungere (scrapare) un nuovo prodotto
  addProduct(url: string): Observable<any> {
    const body = { url };
    // Passiamo url, body e gli headers con il token
    return this.http.post(`${this.apiUrl}/add`, body, { headers: this.getHeaders() });
  }

  // 2. Chiamata GET per recuperare tutti i prodotti dell'utente
  getUserProducts(): Observable<any> {
    // Passiamo l'url e gli headers con il token
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  // 3. Chiamata DELETE per rimuovere un prodotto dal DB
  deleteProduct(productId: string): Observable<any> {
    // La chiamata andrà verso: /api/products/{ID_DEL_PRODOTTO}
    return this.http.delete(`${this.apiUrl}/${productId}`, { headers: this.getHeaders() });
  }
}