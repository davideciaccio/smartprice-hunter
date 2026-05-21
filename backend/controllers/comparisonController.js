const axios = require('axios');

exports.getOnlineCompetitors = async (req, res) => {
  try {
    const query = req.params.query; // Può essere il barcode o il nome del prodotto
    
    // Recuperiamo la chiave dal file .env per sicurezza
    const apiKey = process.env.SERPAPI_KEY; 

    if (!apiKey) {
      return res.status(500).json({ error: 'Chiave API di SerpApi mancante nel server.' });
    }

    // Costruiamo l'URL di SerpApi per Google Shopping (impostato su Italia/Euro)
    // hl=it (lingua italiana), gl=it (geolocalizzazione Italia)
    const serpApiUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&hl=it&gl=it&api_key=${apiKey}`;
    
    // Facciamo la chiamata HTTP
    const response = await axios.get(serpApiUrl);

    // Controlliamo se SerpApi ha trovato risultati di shopping
    if (!response.data || !response.data.shopping_results) {
      return res.status(200).json([]); // Nessun competitor trovato
    }

    const results = response.data.shopping_results;

    // MAGIA: Estraiamo solo i primi 5 risultati e li mappiamo per il nostro frontend
    const competitors = results.slice(0, 5).map(item => {
      return {
        storeName: item.source || 'Negozio Sconosciuto',
        storeIcon: item.source_icon || 'https://via.placeholder.com/20', // Fallback se manca il logo
        price: item.extracted_price || 0,
        formattedPrice: item.price || 'N/D',
        link: item.product_link || '#',
        // Se non è specificato 'second_hand_condition', assumiamo sia nuovo
        condition: item.second_hand_condition || 'new', 
        delivery: item.delivery || '',
        rating: item.rating || null,
        reviewsCount: item.reviews || 0
      };
    });

    // Ordiniamo l'array finale per prezzo crescente (dal più economico)
    competitors.sort((a, b) => a.price - b.price);

    // Inviamo i dati puliti ad Angular
    res.status(200).json(competitors);

  } catch (error) {
    console.error('Errore durante la chiamata a SerpApi:', error.message);
    res.status(500).json({ error: 'Impossibile recuperare i prezzi online al momento.' });
  }
};