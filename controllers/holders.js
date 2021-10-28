const fetch = require('node-fetch');
const { BLOXY_TOKEN_HOLDERS_ENDPOINT } = require('../config');
const { saveToFile, readFile } = require('../helpers');

const FILE_PATH = "data/bloxy_token_holders.json";

const getLiquidEcoData = async () => {
    try {
        const holders = await readFile(FILE_PATH);
        console.info(`Returning cached holder data. Holders: ${holders.data.length}, Cached as of: ${holders.time} (${new Date(holders.time).toLocaleDateString()})`)
        return [...holders.data]; 
    } catch (err) {
        console.error(`holders.js: getLiquidEcoData(): Could not get any holders - ${err.message}`)
        return []; 
    }
}

module.exports = {
    getLiquidEcoData
}