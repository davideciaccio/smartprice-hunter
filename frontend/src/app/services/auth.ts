import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // L'URL del nostro backend Node.js
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) { }

  // Funzione per la registrazione
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Funzione per il login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      // 'tap' ci permette di eseguire un'azione "di lato" quando i dati arrivano, 
      // senza modificare i dati stessi che andranno alla pagina.
      tap((response: any) => {
        if (response && response.token) {
          // Salviamo il token e l'id utente nella memoria del browser
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.userId);

          const userObj = {
            username: response.username,
            role: response.role // Adesso Angular sa se è admin o user!
          };
          
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      })
    );
  }

  // Funzione per il logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  }

  // Controlla se l'utente è loggato verificando la presenza del token
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Recupera il token per le chiamate future (ci servirà nella Fase 4!)
  getToken() {
    return localStorage.getItem('token');
  }
}