// FILE: backend/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Se non l'hai installato: npm install bcrypt
const User = require('./models/User'); // Assicurati che il path al modello sia corretto

// ⚠️ IMPORTANTE: Sostituisci questo URL con la tua stringa di connessione reale di MongoDB 
// (solitamente la trovi nel tuo file .env o server.js)
const MONGO_URI = 'mongodb://127.0.0.1:27017/smartprice_hunter'; 

async function createSuperAdmin() {
  try {
    // 1. Connessione al database
    await mongoose.connect(MONGO_URI);
    console.log('Connesso al database...');

    // 2. Controllo di sicurezza: verifichiamo se l'admin esiste già per non duplicarlo
    const adminExists = await User.findOne({ email: 'admin@smartprice.com' });
    if (adminExists) {
      console.log('⚠️ Un admin con questa email esiste già nel DB.');
      process.exit(0);
    }

    // 3. Criptiamo la password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);

    // 4. Creiamo il documento per il Super Admin usando lo schema aggiornato
    const adminUser = new User({
      username: 'superadmin', // Inserito il campo richiesto dal tuo Schema
      email: 'admin@smartprice.com',
      password: hashedPassword,
      role: 'admin',          // IL CUORE DELL'OPERAZIONE: Assegniamo i permessi!
      isBanned: false
    });

    // 5. Salvataggio nel database
    await adminUser.save();
    console.log('✅ Utente Admin creato con successo!');
    console.log('-----------------------------------');
    console.log('Username: superadmin');
    console.log('Email:    admin@smartprice.com');
    console.log('Password: Admin123!');
    console.log('-----------------------------------');

    process.exit(0); // Chiude lo script con successo

  } catch (error) {
    console.error('❌ Errore durante la creazione dell\'admin:', error);
    process.exit(1); // Chiude lo script segnalando un errore
  }
}

// Avvia la funzione
createSuperAdmin();