const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importiamo il modello User
const Product = require('../models/Product');

// --- 1. CONTROLLER DI REGISTRAZIONE ---
const register = async (req, res) => {
  try {
    // const { ... }: Questa sintassi (chiamata destrutturazione) estrae al volo i valori username, email e password dal pacchetto e crea tre variabili pronte all'uso.
    // req.body è il corpo della richiesta http di tipo POST, ovvero i dati inseriti nel frontend dall'utente
    const { username, email, password } = req.body;

    if (!username || !email || !password ) {
      return res.status(400).json({ message: "Username, Email e password sono richiesti" });
    }

    if (password.length < 8) { // Allineato al frontend (minimo 8)
      return res.status(400).json({ message: "La password deve contenere almeno 8 caratteri." });
    }

    // 1. Controllo se l'EMAIL esiste già
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ field: 'email', message: 'Questa email è già registrata.' });
    }

    // 2. Controllo se l'utente esiste già nel Database
    // await: Dice a Node: "Fermati qui e aspetta che MongoDB abbia finito di cercare prima di andare avanti".
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ field: 'username', message: 'Questo username è già in uso.' });
    }

    // "Salatura" e Criptazione della password
    // Per ogni utente viene generato un Sale in modo che se due utenti hanno due password uguale nel database le password saranno criptate
    // in maniera diversa, l'hashing della password quindi avviene passando come parametri hash(password, salt) 
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
};

// --- 2. CONTROLLER DI LOGIN ---
const login = async (req, res) => {
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
    * La funzione jwt.sign() costruisce questo badge matematico assemblando tre pezzi:
    * Il Payload: È il contenuto del badge. Qui ci mettiamo solo l'ID del database dell'utente (user._id).
      Questo dato è leggibile da chiunque, quindi non si mettono mai le password qui dentro.
    * Il Secret (process.env.JWT_SECRET): È il timbro di cera del tuo server. 
      È una lunghissima stringa incomprensibile salvata in un file nascosto (.env) nel tuo server. 
      Il server usa questo segreto per creare una "Firma Elettronica" sul badge. 
      Se l'utente proverà a modificare il suo ID nel token per fingersi qualcun altro, la firma si romperà e il server lo respingerà.
    * ExpiresIn: Il badge si autodistruggerà tra 24 ora (24h).
      Questo limita i danni nel caso in cui qualcuno rubi il token all'utente.
    */
    const token = jwt.sign(
      { userId: user._id,
        role: user.role
       },
      process.env.JWT_SECRET,   // La nostra chiave segreta
      { expiresIn: '24h' }       // Scadenza del token
    );

    // Restituiamo il token e i dati base dell'utente al frontend
    res.json({ token, userId: user._id, username: user.username, role: user.role });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore del server durante il login.' });
  }
};


// Esportiamo le funzioni per poterle usare nel file delle rotte
module.exports = { register, login };