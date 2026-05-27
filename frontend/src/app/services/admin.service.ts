import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // Recupera tutti gli utenti
  async getAllUsers() {
    return lastValueFrom(this.http.get<any[]>(`${this.apiUrl}/users`, { headers: this.getHeaders() }));
  }

  // Banna un utente
  async banUser(userId: string) {
    return lastValueFrom(this.http.post(`${this.apiUrl}/users/${userId}/ban`, {}, { headers: this.getHeaders() }));
  }

  // Sbanna un utente
  async unbanUser(userId: string) {
    return lastValueFrom(this.http.post(`${this.apiUrl}/users/${userId}/unban`, {}, { headers: this.getHeaders() }));
  }

  // Elimina definitivamente un utente
  async deleteUser(userId: string) {
    return lastValueFrom(this.http.delete(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() }));
  }
}