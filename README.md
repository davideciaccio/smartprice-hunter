# SmartPrice Hunter

## 🛠️ Installazione

Per installare tutte le dipendenze necessarie, assicurandoti di rispettare le versioni bloccate nel file **package-lock.json**, esegui il seguente comando dalla root (cartella principale) del progetto. Questo comando ti installerà tutte le dipendenze contenute dentro **package-lock.json**.

```bash
npm install
```

---

## 🚀 Avvio del Progetto

Il progetto è suddiviso in **Backend** e **Frontend**. È necessario avviarli entrambi aprendo dei terminali separati.

🟢 Terminale 1: Il Backend
Naviga nella cartella originale del backend e mantieni in vita il server e il database:

``` bash
npm run dev
```

🔵 Terminale 2: Il Frontend
Naviga nella cartella frontend 
1. Vai nella cartella: **cd frontend**.
(Nota: se è la primissima volta che apri la cartella, esegui prima npm install per ripristinare i moduli).

Avvia l'app in modalità sviluppo:


``` bash
ionic serve
```


(Attendi che l'app sia compilata e in ascolto sulla porta 8100).

🟣 Terminale 3: Il Tunnel Ngrok
Apri un terzo terminale (sempre dentro frontend) e genera il link HTTP pubblico:


``` bash
npx ngrok http 8100
```

📱 FASE 4: Test su Smartphone
Guarda l'output del Terminale 3 e copia l'URL generato alla riga Forwarding (es. https://abc-123.ngrok-free.app).

Prendi il tuo iPhone/Android, apri Safari/Chrome e digita quell'URL.

Se appare la schermata di benvenuto di Ngrok, clicca su "Visit Site".


