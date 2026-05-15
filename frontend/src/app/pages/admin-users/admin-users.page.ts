import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service'; // Adatta il path

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class AdminUsersPage implements OnInit {
  isSidebarActive: boolean = false;
  users: any[] = [];
  filteredUsers: any[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;

  constructor(
    private adminService: AdminService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  async loadUsers() {
    this.isLoading = true;
    try {
      this.users = await this.adminService.getAllUsers();
      this.filteredUsers = [...this.users];
    } catch (error) {
      console.error('Errore nel caricamento utenti', error);
      this.showToast('Impossibile caricare la lista utenti', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  filterUsers() {
    const term = this.searchQuery.toLowerCase().trim();
    
    // Se la barra è vuota, mostra tutti gli utenti
    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(u => 
      // Sostituito u.name con u.username!
      (u.email?.toLowerCase().includes(term)) || 
      (u.username?.toLowerCase().includes(term))
    );
  }

  async toggleBanStatus(user: any) {
    const action = user.isBanned ? 'sbannare' : 'bannare';
    
    const alert = await this.alertCtrl.create({
      header: 'Conferma Azione',
      message: `Sei sicuro di voler ${action} l'utente <strong>${user.email}</strong>?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { 
          text: 'Conferma', 
          handler: async () => {
            try {
              if (user.isBanned) {
                await this.adminService.unbanUser(user._id);
                this.showToast('Utente riattivato con successo', 'success');
              } else {
                await this.adminService.banUser(user._id);
                this.showToast('Utente bannato con successo', 'warning');
              }
              this.loadUsers(); // Ricarica la lista aggiornata
            } catch (error) {
              this.showToast(`Errore durante l'azione`, 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteUser(user: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminazione Definitiva',
      message: `Attenzione: l'eliminazione dell'utente <strong>${user.email}</strong> è irreversibile. Procedere?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { 
          text: 'Elimina', 
          cssClass: 'alert-button-danger',
          handler: async () => {
            try {
              await this.adminService.deleteUser(user._id);
              this.showToast('Utente eliminato definitivamente', 'success');
              this.loadUsers();
            } catch (error) {
              this.showToast(`Errore durante l'eliminazione`, 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    toast.present();
  }
}