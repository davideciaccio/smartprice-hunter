import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';

export interface Notice {
  id: string;
  title: string;
  message: string;
  type: 'price_drop' | 'alert' | 'system';
  timestamp: string;
  read: boolean;
}

@Component({
  selector: 'app-notices',
  templateUrl: './notices.page.html',
  styleUrls: ['./notices.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class NoticesPage implements OnInit {
  isSidebarActive: boolean = false; 
  activeFilter: 'all' | 'unread' | 'prices' | 'system' = 'all';

  notices: Notice[] = [
    {
      id: 'n1',
      title: 'Calo di prezzo rilevato!',
      message: 'Ottime notizie: il prezzo di Apple iPhone 15 Pro da Euronics è sceso a 999€ (-15%).',
      type: 'price_drop',
      timestamp: '10 min fa',
      read: false
    },
    {
      id: 'n2',
      title: 'Attenzione ai trend',
      message: 'Il prezzo di Sony PlayStation 5 sta salendo costantemente negli ultimi 3 giorni. Valuta se acquistare ora.',
      type: 'alert',
      timestamp: '2 ore fa',
      read: false
    },
    {
      id: 'n3',
      title: 'Nuova funzionalità disponibile',
      message: 'Abbiamo aggiornato la mappa! Ora puoi vedere i prezzi scansionati dagli altri utenti in tempo reale.',
      type: 'system',
      timestamp: '1 giorno fa',
      read: true
    },
    {
      id: 'n4',
      title: 'Occasione in zona!',
      message: 'Un utente ha segnalato AirPods Pro a 199€ presso il negozio Unieuro a 3km da te.',
      type: 'price_drop',
      timestamp: '2 giorni fa',
      read: true
    }
  ];

  constructor(private toastCtrl: ToastController) {}

  ngOnInit() {}

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // FIX TASK 1: Controlla se ci sono messaggi non letti per il bollino rosso
  get hasUnreadNotices(): boolean {
    return this.notices.some(n => !n.read);
  }

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

  markAsRead(id: string) {
    const notice = this.notices.find(n => n.id === id);
    if (notice) {
      notice.read = true;
    }
  }

  markAllAsRead() {
    this.notices.forEach(n => n.read = true);
    this.showToast('Tutti gli avvisi segnati come letti.', 'success');
  }

  deleteNotice(id: string) {
    this.notices = this.notices.filter(n => n.id !== id);
    this.showToast('Avviso eliminato.', 'dark');
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}