// ==========================================
// 1. IMPORT DELLE LIBRERIE E MODULI ESTERNI
// ==========================================
require('dotenv').config(); // Carica per primo le variabili d'ambiente dal file .env (es. PORT, MONGO_URI)
const express = require('express'); // Il framework principale per creare il server web
const mongoose = require('mongoose'); // L'ORM (Object Relational Mapper) per comunicare in modo semplice con MongoDB
const cors = require('cors'); // Middleware per permettere le chiamate dal frontend (evita errori CORS policy)

// Moduli per la documentazione automatica delle API
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// ==========================================
// 2. IMPORT DELLE ROTTE E JOB INTERNI
// ==========================================
const startPriceMonitor = require('./jobs/priceMonitor'); // Il cron job che gira in background ogni 10 minuti
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const accountRoutes = require('./routes/account');
const scannedProductRoutes = require('./routes/scannedProduct');
const adminRoutes = require('./routes/admin');
const comparisonRoutes = require('./routes/comparison');
const noticeRoutes = require('./routes/notices');

// ==========================================
// 3. INIZIALIZZAZIONE DELL'APP E VARIABILI GLOBALI
// ==========================================
const app = express(); // Creiamo l'istanza principale dell'applicazione Express
// Definiamo la porta: cerca la variabile PORT nel file .env, altrimenti usa la 3000 come fallback
const PORT = process.env.PORT || 3000; 

// ==========================================
// 4. CONFIGURAZIONE SWAGGER (DOCUMENTAZIONE)
// ==========================================
// Definiamo le opzioni base per la generazione del file JSON di OpenAPI
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0', // Standard OpenAPI utilizzato
    info: {
      title: 'SmartPrice-Hunter API', // Titolo che apparirà nella UI del browser
      version: '1.0.0', // Versione attuale
      description: 'Documentazione ufficiale delle API del backend di SmartPrice-Hunter',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`, // URL base a cui Swagger manderà le richieste di test
        description: 'Server di Sviluppo'
      }
    ]
  },
  // Swagger cercherà i commenti JSDoc (/** @swagger ... */) in tutti i file dentro queste cartelle
  apis: ['./routes/*.js', './controllers/*.js'], 
};

// Genera l'oggetto JSON di configurazione e lo "monta" sull'interfaccia grafica usando la rotta /api-docs
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ==========================================
// 5. MIDDLEWARE GLOBALI
// ==========================================
// Abilita le richieste cross-origin. Senza questo, il frontend Angular (che gira su un'altra porta) verrebbe bloccato.
app.use(cors({
  origin: "*", // Consente chiamate da qualsiasi origine (in produzione andrebbe limitato all'URL del sito)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Metodi HTTP accettati dal server
  allowedHeaders: ['Content-Type', 'Authorization'] // Header accettati (Authorization serve per inviare il Token JWT)
}));

// Permette a Express di leggere (parsare) il body delle richieste in arrivo in formato JSON (es. req.body.email)
app.use(express.json());

// ==========================================
// 6. REGISTRAZIONE DELLE ROTTE (ROUTING)
// ==========================================
// Applicando il principio della "Separation of Concerns", il file server.js smista solo il traffico.
// Deleghiamo la logica vera e propria ai mini-router presenti nella cartella /routes.


app.get('/', (req, res) => {
  // Semplice rotta per capire se il server risponde
  res.send('Benvenuto nell\'API dell app');
});

// "Agganciamo" i router importati ai relativi prefissi URL:
// Ad esempio: se arriva una richiesta a "/api/auth/login", express la passa a authRoutes.
app.use('/api/auth', authRoutes);           // Gestisce login e registrazione
app.use('/api/products', productRoutes);    // Gestisce i prodotti inseriti via link
app.use('/api/account', accountRoutes);     // Gestisce modifiche profilo utente e cancellazione
app.use('/api/scanned', scannedProductRoutes); // Gestisce i prodotti scansionati con codice a barre
app.use('/api/admin', adminRoutes);         // Gestisce il pannello admin (ban e lista utenti)
app.use('/api/compare', comparisonRoutes);  // Gestisce l'interrogazione delle API di SerpApi
app.use('/api/notices', noticeRoutes);      // Gestisce il sistema di notifiche

// ==========================================
// 7. CONNESSIONE AL DATABASE E AVVIO SERVER
// ==========================================
// Mongoose tenta la connessione a MongoDB usando la stringa di connessione (URI)
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // Il .then() viene eseguito SOLO se la connessione al DB ha successo
    console.log('✅ Connessione a MongoDB stabilita con successo!');
    
    // Avvia il Cron Job in background (monitoraggio prezzi) SOLO quando il DB è pronto
    // Altrimenti rischierebbe di interrogare un DB non ancora connesso
    startPriceMonitor(); 
    
    // Mettiamo il server in ascolto sulla porta definita
    app.listen(PORT, () => {
      console.log(`🚀 Server in esecuzione sulla porta: ${PORT}`);
      console.log(`📄 Swagger UI disponibile su: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    // Il .catch() intercetta eventuali problemi di connessione (es. IP non whitelisted, credenziali errate)
    console.error('❌ Errore di connessione a MongoDB:', err);
  });