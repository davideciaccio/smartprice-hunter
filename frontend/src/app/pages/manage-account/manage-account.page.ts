import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
//IMPORTIAMO 'Router' per la navigazione programmatica
import { RouterModule, Router } from '@angular/router'; 
// IMPORTANTE: Aggiungiamo HttpHeaders per gestire l'autenticazione
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { NoticeService } from '../../services/notices.service';

@Component({
  selector: 'app-manage-account', // Lascia quello generato da Ionic
  templateUrl: './manage-account.page.html', // Lascia quello generato da Ionic
  styleUrls: ['./manage-account.page.scss'], // Lascia quello generato da Ionic
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HttpClientModule]
})

export class ManageAccountPage implements OnInit {
  
  // Variabile per gestire l'apertura del menu su cellulare
  isSidebarActive: boolean = false; 
  usernameForm!: FormGroup;
  passwordForm!: FormGroup;
  
  // Variabili per UX Password (Icona visibilità e warning sulla password)
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  newPasswordError = '';
  unreadCount: number = 0;
  
  private apiUrl = 'http://localhost:3000/api/account'; 

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private noticeService: NoticeService
  ) {}

  ngOnInit() {
    this.initForms();
    this.noticeService.unreadCount$.subscribe(c => this.unreadCount = c);
    this.noticeService.getNotices().subscribe();
  }

  toggleSidebar() { this.isSidebarActive = !this.isSidebarActive; }
  closeSidebar() { this.isSidebarActive = false; }

  // UX Toggles per mostrare/nascondere le password
  toggleCurrentPassword() { this.showCurrentPassword = !this.showCurrentPassword; }
  toggleNewPassword() { this.showNewPassword = !this.showNewPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  initForms() {
    this.usernameForm = this.fb.group({
      newUsername: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      // Qui rimuoviamo minLength dal FormBuilder perché gestiamo l'errore in real-time
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Controlla in tempo reale errori e forza della nuova password
  onPasswordInput() {
    const pass = this.passwordForm.get('newPassword')?.value || '';
    const currentPass = this.passwordForm.get('currentPassword')?.value || '';
    
    if (!pass) {
      this.passwordStrength = 0;
      this.newPasswordError = '';
      return;
    }

    // Calcolo Forza (Barra colorata)
    let strength = 0;
    if (pass.length >= 8) strength++; 
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) strength++; 
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass) && pass.length >= 12) strength++; 
    this.passwordStrength = strength;

    // Valutazione Errori Specifici (Scritte di feedback)
    if (pass === currentPass) {
      this.newPasswordError = 'La nuova password non può essere identica a quella attuale.';
    } else if (pass.length < 8) {
      this.newPasswordError = 'La password deve avere almeno 8 caratteri.';
    } else if (!/[A-Z]/.test(pass)) {
      this.newPasswordError = 'Aggiungi almeno una lettera maiuscola.';
    } else if (!/[a-z]/.test(pass)) {
      this.newPasswordError = 'Aggiungi almeno una lettera minuscola.';
    } else if (!/[0-9]/.test(pass)) {
      this.newPasswordError = 'Aggiungi almeno un numero.';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      this.newPasswordError = 'Aggiungi almeno un carattere speciale (es. ! @ #).';
    } else {
      this.newPasswordError = ''; // Nessun errore
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const newPass = g.get('newPassword')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    if (!newPass || !confirmPass) return null;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  // ==========================================
  // METODO HELPER: Genera gli header con il Token
  // ==========================================
  // Recupera il token JWT salvato nel localStorage al momento del login 
  // e crea l'header di autorizzazione richiesto dal backend.
  private getHeaders() {
    // Recupera il token. NOTA: Assicurati che nel tuo login-component il token sia salvato 
    // esattamente con la chiave 'token' (es. localStorage.setItem('token', ilTuoToken)).
    const token = localStorage.getItem('token'); 
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ==========================================
  // AGGIORNAMENTO USERNAME CON AUTH HEADERS
  // ==========================================
  async updateUsername() {
    if (this.usernameForm.invalid) return;

    const body = { newUsername: this.usernameForm.value.newUsername };

    // Passiamo gli headers come terzo parametro della richiesta PUT
    this.http.put(`${this.apiUrl}/update-username`, body, { headers: this.getHeaders() }).subscribe({
      next: async (res: any) => {
        await this.showToast(res.message || 'Username aggiornatocon successo!', 'success');
        this.usernameForm.reset();
      },
      error: async (err) => {
        const errorMsg = err.error?.message || 'Impossibile aggiornare l\'username.';
        await this.showToast(errorMsg, 'danger');
      }
    });
  }

  // ==========================================
  // CAMBIO PASSWORD CON AUTH HEADERS
  // ==========================================
  async changePassword() {
    // Blocca se il form è invalido o se ci sono errori nella regex della password
    if (this.passwordForm.invalid || this.newPasswordError !== '') return;

    const body = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    // Passiamo gli headers come terzo parametro della richiesta PUT
    this.http.put(`${this.apiUrl}/change-password`, body, { headers: this.getHeaders() }).subscribe({
      next: async (res: any) => {
        await this.showToast(res.message || 'Password modificata con successo!', 'success');
        this.passwordForm.reset(); // Resetta la barra visiva e i campi
        this.passwordStrength = 0; // Resetta la forza della password
      },
      error: async (err) => {
        const errorMsg = err.error?.message || 'Errore durante il cambio password.';
        await this.showToast(errorMsg, 'danger');
      }
    });
  }

  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'Elimina Account',
      subHeader: 'Azione irreversibile!',
      message: 'Per confermare, digita la tua password attuale.',
      cssClass: 'custom-delete-alert',
      inputs: [
        {
          name: 'passwordConfirm',
          type: 'password',
          placeholder: 'Password attuale'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Elimina definitivamente',
          role: 'destructive',
          handler: (data) => {
            if (data.passwordConfirm) {
              this.deleteAccount(data.passwordConfirm);
            } else {
              this.showToast('Inserisci la password per procedere.', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }
  

  // ==========================================
  // ELIMINAZIONE ACCOUNT CON AUTH HEADERS
  // ==========================================
  deleteAccount(passwordConfirm: string) {
    // Nella richiesta DELETE di Angular, il corpo (body) e gli headers 
    // vanno inseriti insieme dentro l'oggetto delle opzioni.
    const options = {
      headers: this.getHeaders(),
      body: { passwordConfirm }
    };

    this.http.delete(`${this.apiUrl}/delete`, options).subscribe({
      next: async (res: any) => {
        await this.showToast('Account rimosso con successo.', 'success');
        // Pulizia del localStorage e reindirizzamento forzato alla pagina di login
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: async (err) => {
        const errorMsg = err.error?.message || 'Errore durante l\'eliminazione.';
        await this.showToast(errorMsg, 'danger');
      }
    });
  }

  // ==========================================
  // DISCONNESSIONE (LOGOUT)
  // ==========================================
  logout() {
    // 1. Pulizia dei dati di sessione/token salvati
    localStorage.clear();
    
    // 2. Feedback per l'utente
    this.showToast('Disconnessione effettuata con successo.', 'success');
    
    // 3. Reindirizzamento alla pagina di login
    this.router.navigate(['/login']);
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }
}  
