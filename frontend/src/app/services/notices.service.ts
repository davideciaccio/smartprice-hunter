import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthService } from './auth'

@Injectable({ providedIn: 'root' })
export class NoticeService {
  private apiUrl = 'http://localhost:3000/api/notices';

  // === IL CUORE DEL BOLLINO DINAMICO ===
  // Inizializziamo a 0. Ogni componente che si "iscriverà" a unreadCount$ 
  // riceverà istantaneamente il numero aggiornato.
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // Recupera gli avvisi dal DB E calcola quanti sono non letti
  getNotices() {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders()).pipe(
      tap((notices) => {
        // Quando i dati arrivano, contiamo quanti hanno read: false
        const unread = notices.filter(n => !n.read).length;
        // Trasmettiamo il nuovo numero a tutta l'app!
        this.unreadCountSubject.next(unread);
      })
    );
  }

  markAsRead(id: string) {
    return this.http.put(`${this.apiUrl}/${id}/read`, {}, this.getHeaders());
  }

  markAllAsRead() {
    return this.http.put(`${this.apiUrl}/read-all`, {}, this.getHeaders()).pipe(
      tap(() => {
        // Se leggiamo tutto, il counter va a 0 istantaneamente
        this.unreadCountSubject.next(0);
      })
    );
  }

  deleteNotice(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }
  
  // Permette ai componenti (es. NoticesPage) di aggiornare il counter manualmente 
  // se un avviso viene cancellato dalla UI senza ricaricare tutto
  updateUnreadCount(count: number) {
    this.unreadCountSubject.next(count);
  }
}