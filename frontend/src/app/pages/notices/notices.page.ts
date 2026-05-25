import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NoticeService } from '../../services/notices.service';
import { Subscription } from 'rxjs'; 
@Component({
  selector: 'app-notices',
  templateUrl: './notices.page.html',
  styleUrls: ['./notices.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class NoticesPage implements OnInit, OnDestroy {
  isSidebarActive: boolean = false; 
  activeFilter: 'all' | 'unread' | 'prices' | 'system' = 'all';

  notices: any[] = [];
  
  // Variabili per il bollino dinamico
  unreadCount: number = 0;
  private unreadSub!: Subscription;

  constructor(
    private toastCtrl: ToastController,
    private noticeService: NoticeService
  ) {}

  ngOnInit() {
    this.loadNotices();
    
    // Ci iscriviamo al "canale" del bollino rosso. Ogni volta che il numero cambia, si aggiorna qui!
    this.unreadSub = this.noticeService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy() {
    // Buona pratica: chiudiamo la connessione quando usciamo dalla pagina
    if (this.unreadSub) {
      this.unreadSub.unsubscribe();
    }
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // 1. CARICA AVVISI DAL DATABASE
  loadNotices() {
    this.noticeService.getNotices().subscribe({
      next: (data) => {
        this.notices = data;
      },
      error: (err) => {
        console.error('Errore nel caricamento avvisi:', err);
        this.showToast('Impossibile caricare gli avvisi.', 'danger');
      }
    });
  }

  // GESTIONE FILTRI DELLA UI
  get filteredNotices() {
    return this.notices.filter(n => {
      if (this.activeFilter === 'unread') return !n.read;
      if (this.activeFilter === 'prices') return n.type === 'price_drop' || n.type === 'alert';
      if (this.activeFilter === 'system') return n.type === 'system';
      return true; 
    });
  }

  setFilter(filter: 'all' | 'unread' | 'prices' | 'system') {
    this.activeFilter = filter;
  }

  // 2. SEGNA UN AVVISO COME LETTO
  markAsRead(id: string) {
    this.noticeService.markAsRead(id).subscribe({
      next: () => {
        // Aggiorniamo la UI localmente per non dover ricaricare tutto dal database
        const notice = this.notices.find(n => n._id === id);
        if (notice) notice.read = true;
        
        // Ricalcoliamo il numero dei non letti e avvisiamo il Service
        const newUnreadCount = this.notices.filter(n => !n.read).length;
        this.noticeService.updateUnreadCount(newUnreadCount);
      }
    });
  }

  // 3. SEGNA TUTTI COME LETTI
  markAllAsRead() {
    this.noticeService.markAllAsRead().subscribe({
      next: () => {
        this.notices.forEach(n => n.read = true);
        this.showToast('Tutti gli avvisi segnati come letti.', 'success');
        // Il service azzera il counter in automatico
      }
    });
  }

  // 4. ELIMINA AVVISO
  deleteNotice(id: string) {
    this.noticeService.deleteNotice(id).subscribe({
      next: () => {
        this.notices = this.notices.filter(n => n._id !== id);
        this.showToast('Avviso eliminato.', 'dark');
        
        // Se eliminiamo un avviso non letto, dobbiamo aggiornare il bollino!
        const newUnreadCount = this.notices.filter(n => !n.read).length;
        this.noticeService.updateUnreadCount(newUnreadCount);
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2000, color, position: 'bottom'
    });
    toast.present();
  }
}