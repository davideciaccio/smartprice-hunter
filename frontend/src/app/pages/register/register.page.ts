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
    password: '',
    confirmPassword: ''
  };

  // UX: Mostra/Nascondi Password
  showPassword = false;
  showConfirmPassword = false;

  // Variabili per i messaggi di errore
  errors = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  // Misuratore robustezza password
  passwordStrength = 0; // 0 = vuota, 1 = debole, 2 = media, 3 = forte

  // Blacklist Frontend
  forbiddenUsernames = ['admin', 'root', 'support', 'webmaster', 'sysadmin', 'smartprice'];
  commonPasswords = ['12345678', 'password', 'qwertyui', '11111111', 'abcdefgh'];

  constructor(private authService: AuthService, private router: Router) {}

  // =====================================
  // UX HANDLERS
  // =====================================
  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  // Autocorreggi lo username quando l'utente esce dal campo (rimuove spazi e fa minuscolo)
  formatUsername() {
    this.userData.username = this.userData.username.trim().toLowerCase();
  }

  // Calcola la forza in tempo reale mentre l'utente digita
  onPasswordInput() {
    const pass = this.userData.password;
    if (!pass) {
      this.passwordStrength = 0;
      return;
    }
    
    let strength = 0;
    if (pass.length >= 8) strength++; // Base
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) strength++; // Media
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass) && pass.length >= 12) strength++; // Forte

    this.passwordStrength = strength;
    
    // Pulisce l'errore se l'utente sta correggendo
    this.errors.password = ''; 
  }

  // =====================================
  // VALIDAZIONE PRINCIPALE
  // =====================================
  validateForm(): boolean {
    this.errors = { username: '', email: '', password: '', confirmPassword: '' };
    let isValid = true;
    this.formatUsername(); // Sicurezza extra pre-validazione

    const user = this.userData.username;
    const email = this.userData.email.trim();
    const pass = this.userData.password;
    const confPass = this.userData.confirmPassword;

    // --- CONTROLLI USERNAME ---
    // Regex: inizia con lettera/numero, contiene lettere/numeri/._- , finisce con lettera/numero. Lunghezza 4-30
    const userRegex = /^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$/;
    
    if (!user) {
      this.errors.username = 'Inserisci uno username.';
      isValid = false;
    } else if (user.length < 4 || user.length > 30) {
      this.errors.username = 'Lo username deve avere tra 4 e 30 caratteri.';
      isValid = false;
    } else if (!userRegex.test(user)) {
      this.errors.username = 'Usa solo lettere, numeri, punti, underscore o trattini. Non iniziare o finire con caratteri speciali.';
      isValid = false;
    } else if (this.forbiddenUsernames.includes(user)) {
      this.errors.username = 'Questo username è riservato o non consentito.';
      isValid = false;
    }

    // --- CONTROLLI EMAIL ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      this.errors.email = 'Inserisci un\'email valida.';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      this.errors.email = 'Formato email non valido (es. utente@dominio.it).';
      isValid = false;
    }

    // --- CONTROLLI PASSWORD ---
    if (!pass) {
      this.errors.password = 'La password è obbligatoria.';
      isValid = false;
    } else if (pass.length < 8 || pass.length > 128) {
      this.errors.password = 'La password deve avere tra 8 e 128 caratteri.';
      isValid = false;
    } else if (!/[A-Z]/.test(pass)) {
      this.errors.password = 'Aggiungi almeno una lettera maiuscola.';
      isValid = false;
    } else if (!/[a-z]/.test(pass)) {
      this.errors.password = 'Aggiungi almeno una lettera minuscola.';
      isValid = false;
    } else if (!/[0-9]/.test(pass)) {
      this.errors.password = 'Aggiungi almeno un numero.';
      isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      this.errors.password = 'Aggiungi almeno un carattere speciale (es. ! @ #).';
      isValid = false;
    } else if (pass.toLowerCase() === email.toLowerCase() || pass.toLowerCase() === user.toLowerCase()) {
      this.errors.password = 'La password non può essere uguale all\'email o allo username.';
      isValid = false;
    } else if (this.commonPasswords.includes(pass) || /^(.)\1{4,}$/.test(pass)) {
      this.errors.password = 'Questa password è troppo debole o ripetitiva.';
      isValid = false;
    }

    // --- CONFERMA PASSWORD ---
    if (!confPass) {
      this.errors.confirmPassword = 'Conferma la tua password.';
      isValid = false;
    } else if (pass !== confPass) {
      this.errors.confirmPassword = 'Le password non coincidono.';
      isValid = false;
    }

    return isValid;
  }

  // =====================================
  // SUBMIT
  // =====================================
  onRegister() {
    if (!this.validateForm()) {
      return; // Blocca la chiamata al server se il frontend rileva errori
    }

    // Se tutto il frontend è OK, chiamiamo il backend.
    // Qui il Backend farà: Verifica Unicità DB, Check MX, SMTP, e API HIBP (Pwned Passwords)
    this.authService.register(this.userData).subscribe({
      next: (response) => {
        alert('Registrazione completata!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Errore registrazione', err);
        // Gestione errori provenienti dal Backend (es. "Email già in uso")
        alert(err.message || 'Errore durante la registrazione. Riprova.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}