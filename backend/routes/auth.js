const express = require('express');

//Express crea un mini-router o mini-app che si occupa esclusivamente di autenticazione
//Questo per evitare di scrivere le rotte nel file principale server.js
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importiamo il modello creato prima




// Le rotte servono a "guidare" il nostro frontend sfruttando metodo HTTP e URL, in sostanza in base
// al metodo che parte dal frontend, qui ci sono le istruzioni per dire al backend come comportarsi.
// Il file sarà agganciato in server.js su /api/auth

// --- 1. ROTTA DI REGISTRAZIONE (POST /api/auth/register) ---
// Il professore lo fa con il blocco try catch nel controller, e poi il metodo post avrà come secondo argomento il file dove c'è la rotta.
router.post('/register', async (req, res) => {
  try {
    //const { ... }: Questa sintassi (chiamata destrutturazione) estrae al volo i valori username, email e password dal pacchetto e crea tre variabili pronte all'uso.
    //req.body è il corpo della richiesta http di tipo POST, ovvero i dati inseriti nel frontend dall'utente
    const { username, email, password } = req.body;

    // Controllo se l'utente esiste già nel Database
    //await: Dice a Node: "Fermati qui e aspetta che MongoDB abbia finito di cercare prima di andare avanti".
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Utente già registrato con questa email.' });
    }

    // "Salatura" e Criptazione della password
    //Per ogni utente viene generato un Sale in modo che se due utenti hanno due password uguale nel database le password saranno criptate
    //in maniera diversa, l'hashing della password quindi avviene passando come parametri hash(password, salt) 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Creazione nuovo utente con la password criptata
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    // Salvataggio nel Database
    await newUser.save();
    res.status(201).json({ message: 'Utente creato con successo!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore del server durante la registrazione.' });
  }
});






// --- 2. ROTTA DI LOGIN (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cerchiamo l'utente per email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenziali non valide.' });
    }

    // Confrontiamo la password inserita con quella criptata nel DB
    // La funzione compare();
    // 1. Prende la password in chiaro appena inviata dall'utente (password).
    // 2. Legge la stringa criptata dal DB (user.password), che contiene al suo interno anche il "sale" (salt) usato durante la registrazione.
    // 3. Prende la password in chiaro, ci applica lo stesso identico sale e la trita con lo stesso algoritmo.
    // 4. Se il nuovo hash generato al volo è identico bit per bit all'hash salvato nel database, significa che la password originale era la stessa. La variabile isMatch diventerà true.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenziali non valide.' });
    }

    // Generazione del Token JWT
    /*
    *La funzione jwt.sign() costruisce questo badge matematico assemblando tre pezzi:
    *Il Payload: È il contenuto del badge. Qui ci mettiamo solo l'ID del database dell'utente (user._id).
    Questo dato è leggibile da chiunque, quindi non si mettono mai le password qui dentro.
    *Il Secret (process.env.JWT_SECRET): È il timbro di cera del tuo server. 
    È una lunghissima stringa incomprensibile salvata in un file nascosto (.env) nel tuo server. 
    Il server usa questo segreto per creare una "Firma Elettronica" sul badge. 
    Se l'utente proverà a modificare il suo ID nel token per fingersi qualcun altro, la firma si romperà e il server lo respingerà.
    *ExpiresIn: Il badge si autodistruggerà tra 1 giorno (1d).
    Questo limita i danni nel caso in cui qualcuno rubi il token all'utente.
    */
    const token = jwt.sign(
      { userId: user._id },     // Payload (dati pubblici ma firmati)
      process.env.JWT_SECRET,   // La nostra chiave segreta
      { expiresIn: '1h' }       // Scadenza del token (1 giorno)
    );

    // Restituiamo il token e i dati base dell'utente al frontend
    res.json({ token, userId: user._id, username: user.username });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore del server durante il login.' });
  }
});

module.exports = router;