const cron = require('node-cron');
const Product = require('../models/Product');

// Importiamo la funzione di scraping esattamente dal controller
const { runScrapingEngine } = require('../controllers/scraperController');

const startPriceMonitor = () => {
    // Sintassi Cron: '*/2 * * * *' = Esegui ogni 2 minuti
    // Sintassi Cron: '* 3 * * *' = Esegui ogni 3 ore
    cron.schedule('* 3 * * *', async () => {
        console.log('[CRON JOB] Avvio controllo prezzi in background...');

        try {
            const products = await Product.find();
            
            if (products.length === 0) {
                console.log('Nessun prodotto da monitorare.');
                return;
            }

            // Cicliamo su ogni prodotto usando for...of (una pagina alla volta)
            for (let product of products) {
                console.log('##################################################');
                console.log(`Analisi di: ${product.name}...`);
                
                try {
                    // CHIAMIAMO IL MOTORE DAL CONTROLLER (STESSA IDENTICA LOGICA!)
                    const scrapedData = await runScrapingEngine(product.url);
                    
                    // Controlliamo che il motore non abbia fallito
                    if (scrapedData && scrapedData.finalPrice > 0) {
                        const newPrice = scrapedData.finalPrice;

                        // Se troviamo un prezzo valido e DIVERSO dall'ultimo salvato, aggiorniamo il DB
                        if (newPrice !== product.currentPrice) {
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