const fetch = require('node-fetch');
const { BLOXY_TOKEN_HOLDERS_ENDPOINT } = require('../config');

const getLiquidEcoData = async () => {
    try {
        const res = await fetch(BLOXY_TOKEN_HOLDERS_ENDPOINT);
        const results = await res.json();

        let holders = results.map(h => { return { address: h.address, balance: h.balance, address_type: h.address_type } })
        return holders
    } catch (err) {
        console.log(err)
        return [];
    }
}

module.exports = {
    getLiquidEcoData
}