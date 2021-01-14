const { ONE_TOKEN_18, CONTRACTS } = require('../config');
const { saveToFile, readFile } = require('../helpers');

const FILE_PATH = "data/freeclaim_stats.json"
const getFreeclaimStats = () => {
    return new Promise(async (res, rej) => {
        CONTRACTS.freeclaim.methods.getCurrentClaimedAddresses().call().then(addresses => {
            CONTRACTS.freeclaim.methods.getCurrentClaimedAmount().call().then(amount => {
                const TOTAL_CLAIMABLE_ADDRESSES = 183035;
                const TOTAL_CLAIMABLE_AMOUNT = 250000000000;
                const CLAIMED_AMOUNT = Math.floor(+amount / ONE_TOKEN_18);
                const CLAIMED_ADDRESSES = Number(addresses)

                const RESULT = {
                    timestamp: Date.now(),
                    claimed_addresses: CLAIMED_ADDRESSES,
                    claimable_addresses: TOTAL_CLAIMABLE_ADDRESSES,
                    claimed_amount: CLAIMED_AMOUNT,
                    claimable_amount: TOTAL_CLAIMABLE_AMOUNT,
                    percent_addresses_claimed: CLAIMED_ADDRESSES / TOTAL_CLAIMABLE_ADDRESSES,
                    percent_amount_claimed: CLAIMED_AMOUNT / TOTAL_CLAIMABLE_AMOUNT,
                }

                saveToFile(FILE_PATH, RESULT)
                res(RESULT)
            })
        }).catch(async (err) => {
            console.log("freeclaim.js - ERROR - ", err.message)
            const RESULT = await readFile(FILE_PATH);

            if(RESULT)
                res(RESULT)
            else rej(err.message)
        })
    })
}

module.exports = {
    getFreeclaimStats,
}