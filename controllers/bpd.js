const { CONTRACTS, ONE_TOKEN_18 } = require('../config');

// METHODS
const getPaydayAmounts = () => {
    return new Promise((resolve, reject) => {
        CONTRACTS.bpd.methods.getPoolYearAmounts().call().then(amounts => {
            const POOLS = amounts.map(amt => Number((amt / ONE_TOKEN_18).toFixed(2)))
            resolve({ bpd_amounts: POOLS });
        }).catch(err => reject(err))
    })
}

const getNextPaydayAmount = () => {
    return new Promise((resolve, reject) => {
        CONTRACTS.bpd.methods.getClosestPoolAmount().call().then(amount => {
            resolve({ next_pool: Number((amount / ONE_TOKEN_18).toFixed(2)) });
        }).catch(err => reject(err))
    })
}

module.exports = {
    getPaydayAmounts,
    getNextPaydayAmount
}