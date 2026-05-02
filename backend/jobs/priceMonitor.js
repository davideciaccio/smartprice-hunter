const cron = require('node-cron');
const puppeteer = require('puppeteer');
const Product = require('../models/Product');

const startPriceMonitor = () => {
    // Sintassi Cron: '* * * * *'
    // '*/2 * * * *' = Esegui ogni 2 minuti (OTTIMO PER TESTARE ORA)
    // '0 3 * * *' = Esegui tutti i giorni alle 03:00 di notte (PER LA CONSEGNA)
    
    cron.schedule('0 3 * * *', async () => {
        console.log('[CRON JOB] Avvio controllo prezzi in background...');

        try {
            // 1. Recuperiamo TUTTI i prodotti dal database
            const products = await Product.find();
            
            if (products.length === 0) {
                console.log('Nessun prodotto da monitorare.');
                return;
            }

            // 2. Apriamo UN SOLO browser per risparmiare memoria
            const browser = await puppeteer.launch({ headless: "new" });

            // 3. Cicliamo su ogni prodotto (usiamo for...of per fare una pagina alla volta e non far crashare il server)
            for (let product of products) {
                console.log(`Analisi di: ${product.name}...`);
                
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

                try {
                    await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    
                    // Estraiamo solo il prezzo, con la stessa logica del controller
                    const newPrice = await page.evaluate(() => {
                        const priceSelectors = ['meta[property="product:price:amount"]', '.a-price-whole', '.price', '[itemprop="price"]', '.current-price'];
                        let priceText = null;
                        for (let selector of priceSelectors) {
                            const el = document.querySelector(selector);
                            if (el) {
                                priceText = el.content || el.innerText;
                                break;
                            }
                        }
                        if (priceText) {
                            return parseFloat(priceText.replace(/[^\d,-]/g, '').replace(',', '.'));
                        }
                        return null;
                    });

                    // 4. Se troviamo un prezzo valido e DIVERSO dall'ultimo salvato, aggiorniamo il DB
                    if (newPrice && newPrice !== product.currentPrice) {
                        product.currentPrice = newPrice;
                        // Aggiungiamo il nuovo prezzo allo storico (la data viene messa in automatico dallo schema)
                        product.priceHistory.push({ price: newPrice }); 
                        
                        await product.save();
                        console.log(`Prezzo AGGIORNATO per ${product.name}: ${newPrice}€`);
                    } else {
                        console.log(`Prezzo invariato per ${product.name}`);
                    }

                } catch (err) {
                    console.error(`Errore durante l'aggiornamento di ${product.name}`);
                } finally {
                    // Chiudiamo la scheda per passare al prossimo prodotto
                    await page.close();
                }
            }

            // Alla fine del ciclo, chiudiamo l'intero browser
            await browser.close();
            console.log('[CRON JOB] Controllo prezzi terminato con successo.');

        } catch (error) {
            console.error('Errore nel Cron Job:', error);
        }
    });
};

// Esportiamo la funzione per poterla avviare dal server.js
module.exports = startPriceMonitor;