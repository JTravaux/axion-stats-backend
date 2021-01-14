const { ONE_TOKEN_18 } = require('../config.js');
const { getLiquidEcoData } = require('./holders');
const { getActiveStakesByAddress } = require('./staking');
const { calculateEcosystemLevels } = require('../helpers');

const calculateEcosystem = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const LIQUID_DATA = await getLiquidEcoData();
            const STAKER_DATA = await getActiveStakesByAddress();

            let liquid = []
            let staked = []
            let combined = [];

            // Format LIQUID data
            liquid = [
                ...LIQUID_DATA.filter(h =>
                    h.balance >= 1 &&
                    h.address_type === "Wallet" &&
                    h.address !== "0xe8b283b606a212d82036f74f88177375125440f6"
                ).map(l => { return { address: l.address.toUpperCase(), balance: l.balance } })
            ]

            // Format STAKER data
            Object.keys(STAKER_DATA).forEach(addr => {
                let balance = 0;
                STAKER_DATA[addr].forEach(r => { balance += Number(r.amount) })
                staked.push({ address: addr.toUpperCase(), balance: balance/ONE_TOKEN_18 })
            })

            // Get first data (seperate)
            const LIQUID_RESULTS = calculateEcosystemLevels(liquid);
            const STAKED_RESULTS = calculateEcosystemLevels(staked);

            // Combine address who have both staked & liquid AXN
            staked.concat(liquid).forEach(tc => {
                const IDX = combined.findIndex(c => c.address === tc.address);
                if (IDX === -1)
                    combined.push(tc)
                else 
                    combined[IDX].balance += tc.balance 
            })
            
            // Get final data
            const COMBINED_RESULTS = calculateEcosystemLevels(combined)
            
            resolve({ 
                liquid_ecosystem:   {...LIQUID_RESULTS}, 
                staking_ecosystem:  {...STAKED_RESULTS}, 
                combined_ecosystem: {...COMBINED_RESULTS}
            })
        } catch (err) {
            console.log(err);
            reject(err)
        }
    })
}

module.exports = {
    calculateEcosystem
}