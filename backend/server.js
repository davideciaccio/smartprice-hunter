// Importiamo le librerie necessarie
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Carica le variabili dal file .env

// Inizializziamo l'app Express
const app = express(); //l'app principale
const startPriceMonitor = require('./jobs/priceMonitor');

// const swaggerAutogen = require('swagger-autogen')();
// serve oer la documentazione.
// aggiungi altre 3 linee per dire il path dove generare la documentazione

// Abilita le richieste da altri domini, dal nostro frontend Angular
app.use(cors({
  origin: "*", 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Permette ad Express di "capire" i dati in formato JSON
app.use(express.json());

// Utilizziamo la stringa di connessione salvata nel file .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connessione a MongoDB stabilita con successo!');
    
    // Avvia il Cron Job in background SOLO quando il DB è pronto
    startPriceMonitor(); 
  })
  .catch((err) => {
    console.error('Errore di connessione a MongoDB:', err);
  });

  
// --- ROTTA DI BASE ---
app.get('/', (req, res) => {
  res.send('Benvenuto nell\'API dell app');
});




// Importiamo e usiamo le rotte di autenticazione
// 1. IMPORTI IL MINI-ROUTER
const authRoutes = require('./routes/auth');

// 2. LO AGGANCI ALL'APP PRINCIPALE
// Stai dicendo: "Per tutte le richieste che iniziano con '/api/auth', 
// delega il lavoro al mini-router 'authRoutes'"
app.use('/api/auth', authRoutes);


const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);


// Funzione listen per mettere il server in ascolto sulla porta 3000
// Leggiamo la porta dal .env, altrimenti usiamo la 3000 di default
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta: ${PORT}`);
});

// Principio della Separation of Concerns
// Importiamo e usiamo le rotte di gestione account (account.js)
const accountRoutes = require('./routes/account');
// Registrazione del macro-endpoint per l'account
// Questa riga dice: "Da ora in poi, qualsiasi richiesta HTTP che inizia con il prefisso /api/account 
// non gestirla qui, ma passala direttamente al modulo accountRoutes che abbiamo importato prima."
// In questo modo, tutte le rotte definite in accountRoutes (come /update-username, /change-password, /delete)
// saranno accessibili tramite URL come /api/account/update-username, /api/account/change-password, ecc."
app.use('/api/account', accountRoutes);

const scannedProductRoutes = require('./routes/scannedProduct')
app.use('/api/scanned', scannedProductRoutes);