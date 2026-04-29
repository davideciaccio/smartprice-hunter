import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegisterPage {
  userData = {
    username: '',
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    this.authService.register(this.userData).subscribe({
      next: (response) => {
        console.log('Registrazione completata!');
        alert('Registrazione avvenuta con successo! Ora puoi fare il login.');
        this.router.navigate(['/login']); // Rimandiamo l'utente al login
      },
      error: (err) => {
        console.error('Errore registrazione', err);
        alert('Errore durante la registrazione. Riprova.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}