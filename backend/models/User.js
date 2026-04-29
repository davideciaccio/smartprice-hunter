// la funzione require() è la funzione predefinita per importare pacchetti, librerie o altri file.
// prendiamo la libreria mongoose dalla cartella node_modules
// salva tutto in una costante chiamata mongoose
const mongoose = require('mongoose');

/* * ==========================================
 * USER SCHEMA
 * ==========================================
 * Utilizziamo Mongoose per definire uno Schema fisso su un database NoSQL.
 * Motivi principali:
 * 1. MongoDB, essendo un database noSQL accetterebbe qualsiasi oggetto JSON. Mongoose fa da "dogana": 
 * 2. questo Schema definisce le regole esatte (campi obbligatori, tipi di dato, default) che un Utente deve rispettare per poter entrare nel nostro database.
 * 3. Sicurezza: ci permette di agganciare middleware (es. per l'hashing della password prima del salvataggio).
 */

// Definiamo lo schema Utente

const userSchema = new mongoose.Schema({
    username: { 
    type: String, 
    required: true, 
    unique: true // Non possono esserci due username uguali
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true // Aggiunge in automatico createdAt e updatedAt
});


// In Node.js, ogni file è considerato un modulo separato. 
// Immagina ogni file come una scatola chiusa: le variabili e le funzioni create dentro un file non sono visibili agli altri file
// a meno che tu non decida esplicitamente di "esportarle"
// module è un oggetto speciale che Node.js mette a disposizione 
// Esportiamo il modello per poterlo usare nel resto dell'app
module.exports = mongoose.model('User', userSchema);

