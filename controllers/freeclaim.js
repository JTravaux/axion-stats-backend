const fs = require("fs");
const { ONE_TOKEN_18, CONTRACTS, web3 } = require('../config');

const FILE_PATH = "data/freeclaim_stats.json"
const _saveResult = data => {
    fs.writeFile(FILE_PATH, JSON.stringify(data), (err) => {
        if (err) console.log(err);
    });
}

const _readSavedResult = () => {
    return new Promise(resolve => {
        fs.readFile(FILE_PATH, "utf-8", (err, data) => {
            if (err) return resolve(null)
            else return resolve(JSON.parse(data))
        });
    })
}


const getFreeclaimStats = () => {
    return new Promise(async (res, rej) => {
        CONTRACTS.freeclaim.methods.getCurrentClaimedAddresses().call().then(addresses => {
            CONTRACTS.freeclaim.methods.getCurrentClaimedAmount().call().then(amount => {
                const TOTAL_CLAIMABLE_ADDRESSES = 183035;
                const TOTAL_CLAIMABLE_AMOUNT = 250000000000;
                const CLAIMED_AMOUNT = Math.floor(Number(amount / ONE_TOKEN_18));
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

                _saveResult(RESULT)
                res(RESULT)
            })
        }).catch(async (err) => {
            console.log("freeclaim.js - ERROR - ", err.message)
            const RESULT = await _readSavedResult();

            if(RESULT)
                res(RESULT)
            else rej(err.message)
        })
    })
}

module.exports = {
    getFreeclaimStats,
}