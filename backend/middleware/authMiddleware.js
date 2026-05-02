const jwt = require("jsonwebtoken");

// Middleware che che verifica che quell'utente sia effettivamente loggato
// possiamo usare per proteggere le rotte che può fare solo un utente loggato.

module.exports = (req, res, next) => {
    // 1. Cerchiamo l'header authorization
    const authHeader = req.headers["authorization"];

    // 2. Se non c'è, blocchiamo l'accesso
    if (!authHeader) {
        return res.status(401).json({ message: "Access denied" });
    }

    // 3. Estraiamo il token
    const token = authHeader.split(" ")[1];

    try {
        // Log utili per il debugging (ottimi per l'esame)
        console.log("Token received:", token);
        
        // 4. Verifichiamo il token usando la chiave segreta del nostro file .env
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Agganciamo i dati dell'utente alla richiesta e passiamo al prossimo step
        req.user = verified;
        next();
    } catch (err) {
        // Se il token è falso o scaduto
        res.status(400).json({ message: "Invalid token" });
    }
};