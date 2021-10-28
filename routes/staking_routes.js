const express = require('express');
const staking_router = express.Router();
const { readFile, saveToFile } = require('../helpers')
const { addOne } = require('../controllers/db.js');

const { 
    _getEvents,
    getShareRate,
    getTotalShares,
    getStakingStats,
    updateMaxSharesData, 
    updateStakeEventsData, 
    getStakeUnstakeEvents,
    updateUnstakeEventsData,
    getActiveStakesByAddress,
    getCompletedStakesByAddress, 
} = require('../controllers/staking');
const { ONE_TOKEN_18 } = require('../config');

let totalsCache;
let totalShares;
let updateMinutes = 5;
const UPDATE_MS = (1000 * 60) * updateMinutes;
const STAKE_EVENTS_FILE = "data/stake_events_raw.json";
const UNSTAKE_EVENTS_FILE = "data/unstake_events_raw.json";

staking_router.get('/totals', async (req, res) => {
    try {
        if (!totalsCache){

            // Get and save results
            totalsCache = await getStakingStats();
            // addOne("staking_stats", totalsCache);
            updateMaxSharesData();

            // Refresh stats
            setInterval(async () => {
                totalsCache = await getStakingStats();
                await updateMaxSharesData();
            }, UPDATE_MS);

            // Update DB every 30 mins
            // setInterval(() => { addOne("staking_stats", totalsCache) }, (1000 * 60) * 30);

            // Return result
            res.status(200).send(totalsCache)
        }
        else res.status(200).send(totalsCache);
    } catch (err) {
        console.log("staking_routes error: ", err);
        res.status(500).send(totalsCache);
    }
})

staking_router.get('/all-stake-events', async (req, res) => {
    try {
        const STAKE_EVENTS = await readFile(STAKE_EVENTS_FILE);
        res.status(200).send(STAKE_EVENTS)
    } catch (err) {
        console.log("staking_routes error: ", err);
        res.status(500).send({message: "There was an error reading STAKE events."});
    }
})

staking_router.get('/all-unstake-events', async (req, res) => {
    try {
        const STAKE_EVENTS = await readFile(UNSTAKE_EVENTS_FILE);
        res.status(200).send(STAKE_EVENTS)
    } catch (err) {
        console.log("staking_routes error: ", err);
        res.status(500).send({ message: "There was an error reading UNSTAKE events." });
    }
})

let stakesByAddressCache;
staking_router.get('/stakes/active/:addr', async (req, res) => {
    const REQ_ADDR = req.params.addr
    
    try {
        if (!stakesByAddressCache) {
            stakesByAddressCache = await getActiveStakesByAddress();
            setInterval(async () => {
                stakesByAddressCache = await getActiveStakesByAddress();
            }, UPDATE_MS)
        }

        let result = [];
        if (stakesByAddressCache[REQ_ADDR])
            result = stakesByAddressCache[REQ_ADDR];

        const TOTAL_AXN_STAKED = result.reduce((a, b) => a + (+b.amount / ONE_TOKEN_18), 0);
        const TOTAL_SHARES_STAKES = result.reduce((a, b) => a + (+b.shares / ONE_TOKEN_18), 0);

        if(!totalShares)
            totalShares = await getTotalShares();

        let totals = {
            total_axn: TOTAL_AXN_STAKED,
            total_shares: TOTAL_SHARES_STAKES,
            global_shares: totalShares / 1e6
        }

        res.status(200).send({
            stakes: result,
            totals
        })
    } catch (err) {
        console.log("staking_routes error: ", err);
        res.status(500).send({ message: "There was an error reading active stakes for " + req.params.addr });
    }
})

let completedStakesByAddressCache;
staking_router.get('/stakes/complete/:addr', async (req, res) => {
    const REQ_ADDR = req.params.addr

    try {
        if (!completedStakesByAddressCache) {
            completedStakesByAddressCache = await getCompletedStakesByAddress();
            setInterval(async () => {
                completedStakesByAddressCache = await getCompletedStakesByAddress();
            }, UPDATE_MS)
        }

        let result = [];
        if (completedStakesByAddressCache[REQ_ADDR])
            result = completedStakesByAddressCache[REQ_ADDR];

        res.status(200).send(result)
    } catch (err) {
        console.log("staking_routes error: ", err);
        res.status(500).send({ message: "There was an error reading completed stakes for " + req.params.addr });
    }
})

staking_router.get('/latest-events/:num?', async (req, res) => {
    let num = Number(req.params.num);
    if(isNaN(num))
        num = 20

    try {
        const LATEST_EVENTS = await getStakeUnstakeEvents(num);
        res.status(200).send(LATEST_EVENTS)
    } catch (err) {
        console.log("staking_routes error: ", err);
        res.status(500).send({ message: "There was an error reading latest events" });
    }
})

let shareRateCache;
staking_router.get('/shareRate', async (req, res) => {
    try {
        if (!shareRateCache) {
            let shareRate = await getShareRate();
            shareRateCache = shareRate / ONE_TOKEN_18
            setInterval(async () => {
                let shareRate = await getShareRate();
                shareRateCache = shareRate / ONE_TOKEN_18
            }, UPDATE_MS * 3)
            res.status(200).send({ shareRate: shareRateCache })
        } else
            res.status(200).send({ shareRate: shareRateCache })
    } catch (err) {
        console.log("staking_routes error: ", err);
        res.status(500).send({ message: "There was an error pulling the share rate." });
    }
})

staking_router.get('/totalShares', async (req, res) => {
    try {
        if (!totalShares) {
            totalShares = await getTotalShares();
            res.status(200).send({ totalShares: totalShares / ONE_TOKEN_18 })
        } else
            res.status(200).send({ totalShares: totalShares / ONE_TOKEN_18 })
    } catch (err) {
        console.log("staking_routes error: ", err);
        res.status(500).send({ message: "There was an error pulling the total shares." });
    }
})

module.exports = staking_router;