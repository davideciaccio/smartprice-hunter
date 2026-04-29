import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router'; // Ci serve per cambiare pagina
import { AuthService } from '../../services/auth'; // Il nostro servizio!

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  // Importiamo i moduli necessari (specialmente FormsModule per gli input)
  imports: [IonicModule, CommonModule, FormsModule] 
})
export class LoginPage {
  // Oggetto che conterrà i dati digitati dall'utente
  credentials = {
    email: '',
    password: ''
  };

  // Iniettiamo i servizi nel costruttore
  constructor(private authService: AuthService, private router: Router) {}

  // Funzione chiamata al click del bottone "Accedi"
  onLogin() {
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login riuscito!', response);
        // Se va a buon fine, andiamo alla dashboard
        this.router.navigate(['/dashboard']); 
      },
      error: (err) => {
        console.error('Errore durante il login', err);
        alert('Credenziali non valide, riprova!');
      }
    });
  }

  // Funzione per navigare alla pagina di registrazione
  goToRegister() {
    this.router.navigate(['/register']);
  }
}