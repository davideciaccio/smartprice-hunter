// Importiamo le librerie necessarie
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Carica le variabili dal file .env

// Inizializziamo l'app Express
const app = express();

// --- MIDDLEWARE ---
// Abilita le richieste da altri domini (es. dal nostro frontend Angular)
app.use(cors());
// Permette ad Express di "capire" i dati in formato JSON inviati nel body delle richieste
app.use(express.json());

// --- CONNESSIONE AL DATABASE ---
// Utilizziamo la stringa di connessione salvata nel file .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connessione a MongoDB stabilita con successo!'))
  .catch((err) => console.error('❌ Errore di connessione a MongoDB:', err));

// --- ROTTE DI BASE (Test) ---
app.get('/', (req, res) => {
  res.send('Benvenuto nell\'API di SmartPrice Hunter!');
});

// --- AVVIO DEL SERVER ---
// Leggiamo la porta dal .env, altrimenti usiamo la 3000 di default
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server in esecuzione sulla porta: ${PORT}`);
});