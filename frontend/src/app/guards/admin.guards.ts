import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private router: Router, private toastCtrl: ToastController) {}

  async canActivate(): Promise<boolean> {
    // 1. Recuperiamo i dati dell'utente loggato (es. dal localStorage o da un AuthService)
    const userData = localStorage.getItem('user'); 
    
    if (userData) {
      const user = JSON.parse(userData);
      
      // 2. Controlliamo se ha il ruolo 'admin'
      if (user && user.role === 'admin') {
        return true; // Navigazione consentita!
      }
    }

    // 3. Se non è admin (o non è loggato), blocchiamo e rimandiamo alla dashboard
    const toast = await this.toastCtrl.create({
      message: 'Accesso negato. Area riservata agli amministratori.',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();

    this.router.navigate(['/login']);
    return false; // Navigazione bloccata
  }
}