const cron = require('node-cron');
const Product = require('../models/Product');
const Notice = require('../models/Notices'); // <--- AGGIUNTO IL MODELLO DELLE NOTIFICHE

// Importiamo la funzione di scraping esattamente dal controller
const { runScrapingEngine } = require('../controllers/scraperController');

const startPriceMonitor = () => {
    // Sintassi Cron: '*/5 * * * *' = Esegui ogni 5 minuti
    // Sintassi Cron: '0 */3 * * *' = Esegui ogni 3 ore
    cron.schedule('0 */3 * * *', async () => {
        console.log('[CRON JOB] Avvio controllo prezzi in background...');

        try {
            const products = await Product.find();
            
            if (products.length === 0) {
                console.log('Nessun prodotto da monitorare');
                return;
            }

            // Ciclo su ogni prodotto
            for (let product of products) {
                console.log('##################################################');
                console.log(`Analisi di: ${product.name}...`);
                
                try {
                    // CHIAMIAMO IL MOTORE DAL CONTROLLER (STESSA IDENTICA LOGICA!)
                    const scrapedData = await runScrapingEngine(product.url);
                    
                    // Controlliamo che il motore non abbia fallito
                    if (scrapedData && scrapedData.finalPrice > 0) {
                        const newPrice = scrapedData.finalPrice;
                        const oldPrice = product.currentPrice; // Salviamo il vecchio prezzo per fare il confronto

                        // Se troviamo un prezzo valido e DIVERSO dall'ultimo salvato, aggiorniamo il DB e avvisiamo l'utente
                        if (newPrice !== oldPrice) {
                            
                            // =======================================================
                            // CREAZIONE NOTIFICA DINAMICA IN BASE AL TREND (CALO/AUMENTO)
                            // =======================================================
                            if (newPrice < oldPrice) {
                                // Calcoliamo la % di sconto
                                const sconto = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
                                
                                await Notice.create({
                                    user: product.user, 
                                    title: 'Calo di prezzo rilevato! 📉 ',
                                    message: `Ottime notizie: il prezzo di "${product.name}" è sceso a €${newPrice.toFixed(2)} (-${sconto}%).`,
                                    type: 'price_drop'
                                });
                                console.log(`[NOTIFICA] Creato avviso di calo prezzo per l'utente ${product.user}`);
                                
                            } else if (newPrice > oldPrice) {
                                await Notice.create({
                                    user: product.user,
                                    title: 'Prezzo in aumento ⚠️',
                                    message: `Attenzione: il prezzo di "${product.name}" è salito a €${newPrice.toFixed(2)}.`,
                                    type: 'alert'
                                });
                                console.log(`[NOTIFICA] Creato avviso di aumento prezzo per l'utente ${product.user}`);
                            }
                            // =======================================================

                            // Aggiorniamo le variabili del prodotto con il nuovo prezzo
                            product.currentPrice = newPrice;
                            
                            // Aggiungiamo il nuovo prezzo allo storico
                            product.priceHistory.push({ price: newPrice }); 
                            
                            await product.save();
                            console.log(`Prezzo AGGIORNATO per ${product.name}: ${newPrice}€`);
                        } else {
                            console.log(`Prezzo invariato per ${product.name}: ${newPrice}€`);
                        }
                    } else {
                        console.log(`Errore o prezzo non trovato per ${product.name}`);
                    }

                } catch (err) {
                    console.error(`Errore durante l'aggiornamento di ${product.name}:`, err.message);
                }
            }

            console.log('[CRON JOB] Controllo prezzi terminato.');
            console.log('##################################################');

        } catch (error) {
            console.error('Errore nel Cron Job:', error);
            console.log('##################################################');
        }
    });
};

module.exports = startPriceMonitor;