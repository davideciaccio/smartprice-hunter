//Si occupa della gestione delle funzionalità previste nella schermata di gestione del profilo.

const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Assicurati che il percorso del tuo modello User sia corretto
const Product = require('../models/Product'); // Assicurati che il percorso del tuo modello Product sia corretto

// =========================================================================
// MACRO BLOCCO 1: AGGIORNAMENTO USERNAME
// =========================================================================
// Gestisce la modifica dello username accertandosi che non sia vuoto 
// e che non sia già stato preso da un altro utente nel database.
exports.updateUsername = async (req, res) => {
    try {
        const { newUsername } = req.body;

        //Estraiamo l'ID esattamente come è salvato nel payload JWT in authController.js
        const userId = req.user.userId;

        // Validazione dell'input lato server (essenziale per la sicurezza)
        if (!newUsername || newUsername.trim() === "") {
            return res.status(400).json({ message: "Lo username non può essere vuoto." });
        }

        // Controllo di unicità: evita duplicati nel database
        const userExists = await User.findOne({ username: newUsername });
        if (userExists) {
            // Se l'username esiste e l'ID è uguale al tuo, ti avvisa che è già il tuo!
            if (userExists._id.toString() === userId.toString()) {
                return res.status(400).json({ message: "Questo è già il tuo username attuale!" });
            }
            // Se l'ID è diverso, significa che appartiene a qualcun altro
            return res.status(400).json({ message: "Questo username è già utilizzato da un altro utente." });
        }

        // Aggiorniamo l'utente usando userId estratto correttamente
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username: newUsername },
            {returnDocument: 'after'}
        ).select('-password'); // Escludiamo la password per motivi di sicurezza

        //Se updatedUser è null, significa che l'utente non esiste nel DB
        if (!updatedUser) {
            return res.status(404).json({ message: "Utente non trovato nel database." });
        }

        return res.status(200).json({
            message: "Username aggiornato con successo!",
            user: updatedUser
        });
    } catch (error) {
        console.error("Errore updateUsername controller:", error);
        return res.status(500).json({ message: "Errore interno del server durante l'aggiornamento." });
    }
};

// =========================================================================
// MACRO BLOCCO 2: CAMBIO PASSWORD
// =========================================================================
// Consente all'utente di impostare una nuova password. Richiede la vecchia
// password per sicurezza e applica l'hashing (bcrypt) prima del salvataggio.

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Compila tutti i campi richiesti." });
        }

        // --- NUOVI CONTROLLI DI SICUREZZA (Coerenti con la Registrazione) ---
        if (newPassword.length < 8) return res.status(400).json({ message: "La password deve avere almeno 8 caratteri." });
        if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ message: "Aggiungi almeno una lettera maiuscola." });
        if (!/[a-z]/.test(newPassword)) return res.status(400).json({ message: "Aggiungi almeno una lettera minuscola." });
        if (!/[0-9]/.test(newPassword)) return res.status(400).json({ message: "Aggiungi almeno un numero." });
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) return res.status(400).json({ message: "Aggiungi almeno un carattere speciale." });

        const userId = req.user.userId;
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            return res.status(404).json({ message: "Utente non trovato." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "La password attuale non è corretta." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();

        return res.status(200).json({ message: "Password modificata con successo!" });
    } catch (error) {
        console.error("Errore changePassword controller:", error);
        return res.status(500).json({ message: "Errore interno del server." });
    }
};

// =========================================================================
// MACRO BLOCCO 3: ELIMINAZIONE ACCOUNT (CASCADE DELETE)
// =========================================================================
// Rimuove permanentemente l'utente dal sistema. Esegue un'eliminazione a 
// cascata cancellando anche tutti i prodotti associati al suo ID per evitare
// dati orfani (data integrity) all'interno del database.
exports.deleteAccount = async (req, res) => {
    try {
        const { passwordConfirm } = req.body;

        // Richiediamo la password come ultima barriera di sicurezza prima dell'azione distruttiva
        if (!passwordConfirm) {
            return res.status(400).json({ message: "Inserisci la tua password per confermare l'eliminazione." });
        }

        const userId = req.user.userId;
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: "Utente non trovato." });
        }

        // Verifichiamo che la password sia corretta
        const isMatch = await bcrypt.compare(passwordConfirm, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password errata. Impossibile eliminare l'account." });
        }

        // 1. Cascade Delete: Rimuove tutti i record dei prodotti tracciati dall'utente
        //In scraperController.js salviamo i prodotti usando la chiave "user" che è un ObjectId che punta all'ID dell'utente. 
        //Quindi qui cancelliamo tutti i prodotti che hanno quel userId.
        await Product.deleteMany({ user: userId });

        // 2. Rimozione fisica dell'utente dal database
        await User.findByIdAndDelete(userId);

        return res.status(200).json({ 
            message: "Account e prodotti monitorati eliminati definitivamente." 
        });
    } catch (error) {
        console.error("Errore deleteAccount controller:", error);
        return res.status(500).json({ message: "Errore durante l'eliminazione dei dati." });
    }
};
