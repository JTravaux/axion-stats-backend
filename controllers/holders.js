const fetch = require('node-fetch');
const { BLOXY_TOKEN_HOLDERS_ENDPOINT } = require('../config');
const { saveToFile, readFile } = require('../helpers');

const FILE_PATH = "data/bloxy_token_holders.json";

const getLiquidEcoData = async () => {
    try {
        const res = await fetch(BLOXY_TOKEN_HOLDERS_ENDPOINT);
        const results = await res.json();
        const holders = results.map(h => { return { address: h.address, balance: h.balance, address_type: h.address_type } });

        saveToFile(FILE_PATH, {
            data: holders,
            time: Date.now()
        }).catch(e => console.error(`Unable to save token holders to file (${FILE_PATH}): ${e.message}`));

        return holders;
    } catch (err) {
        console.error("Bloxy token holders API Error: No Response.")
        readFile(FILE_PATH)
            .then(holders => { 
                console.info(`Returning cached holder data. Holders: ${holders.data.length}, Cached as of: ${holders.time} (${new Date(holders.time).toLocaleDateString()})`)
                return [...holders.data]; 
            })
            .catch(e => { 
                console.error(`holders.js: getLiquidEcoData(): Could not get any holders - ${e.message}`)
                return []; 
            })
    }
}

module.exports = {
    getLiquidEcoData
}