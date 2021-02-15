const express = require('express');
const staking_router = express.Router();
const { readFile, saveToFile } = require('../helpers')
const { addOne } = require('../controllers/db.js');

const { getStakingStats, getActiveStakesByAddress, getCompletedStakesByAddress, getStakeUnstakeEvents, getTotalShares, _getEvents, getShareRate, updateMaxSharesData, updateStakeEventsData, updateUnstakeEventsData } = require('../controllers/staking');
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
            addOne("staking_stats", totalsCache);
            updateMaxSharesData();

            // Refresh stats
            setInterval(async () => {
                totalsCache = await getStakingStats();
                await updateMaxSharesData();
            }, UPDATE_MS);

            // Update DB every 30 mins
            setInterval(() => { addOne("staking_stats", totalsCache) }, (1000 * 60) * 30);

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
            global_shares: totalShares / ONE_TOKEN_18
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
        res.status(500).send({ message: "There was an error pulling the share rate." });
    }
})

const PASSWORD = "AxionDev79"
staking_router.get('/refresh', async (req, res) => {
    const KEY = req.query.key;
    const TYPE = req.query.type;

    if (!KEY || KEY !== PASSWORD) {
        res.sendStatus(403);
        return;
    }
    
    if (!TYPE || (TYPE !== "StakeUnstake" && TYPE !== "MaxShareUpgrade" && TYPE !== "Stake" && TYPE !== "Unstake")) {
        res.status(500).send("Invalid type. Must be either: StakeUnstake, MaxShareUpgrade, Stake, Unstake");
        return;
    }

    try {
        let result = []
        if (TYPE === "StakeUnstake") {
            const stakeEvents = await updateStakeEventsData();
            const unstakeEvents = await updateUnstakeEventsData();
            result = stakeEvents.concat(unstakeEvents)
        }
        else if (TYPE === "Stake") 
            result = await updateStakeEventsData();
        else if (TYPE === "Unstake")
            result = await updateUnstakeEventsData();
        else if (TYPE === "MaxShareUpgrade")
            result = await updateMaxSharesData();
        res.status(200).send({ status: `Done! Got a total of ${result.length} ${TYPE} new events.` })
    } catch (err) { res.status(500).send({ status: err.message }) }
})

staking_router.get('/fetch-total-staked', async (req, res) => {
    const KEY = req.query.key;

    if (!KEY || KEY !== PASSWORD) {
        res.sendStatus(403);
        return;
    }

    const TYPE = req.query.type || "cached";

    let STAKE_EVENTS;
    let UNSTAKE_EVENTS;
    let SORTED_STAKES;
    let SORTED_UNSTAKES;

    const STAKE_EVENTS_FILE = "data/events_stake.json";
    const UNSTAKE_EVENTS_FILE = "data/events_unstake.json";

    if(TYPE === "fresh") {
        ////////////////
        // FRESH DATA //
        ///////////////
        const V1_START_BLOCK = 11248075;
        const V1_END_BLOCK = 11472614;

        const stakes_v1 = await _getEvents("Stake", "staking_v1", V1_START_BLOCK, V1_END_BLOCK)
        const stakes_v2 = await _getEvents("Stake")
        STAKE_EVENTS = stakes_v1.concat(stakes_v2);
        SORTED_STAKES = STAKE_EVENTS.sort((a, b) => +b.block - +a.block)
        await saveToFile(STAKE_EVENTS_FILE, SORTED_STAKES)

        const unstakes_v1 = await _getEvents("Unstake", "staking_v1", V1_START_BLOCK, V1_END_BLOCK)
        const unstakes_v2 = await _getEvents("Unstake")
        UNSTAKE_EVENTS = unstakes_v1.concat(unstakes_v2);
        SORTED_UNSTAKES = UNSTAKE_EVENTS.sort((a, b) => +b.block - +a.block)
        await saveToFile(UNSTAKE_EVENTS_FILE, SORTED_UNSTAKES)
    } else {
        ////////////////
        // FILE DATA //
        ///////////////
        STAKE_EVENTS = await readFile(STAKE_EVENTS_FILE)
        SORTED_STAKES = [...STAKE_EVENTS];

        UNSTAKE_EVENTS = await readFile(UNSTAKE_EVENTS_FILE)
        SORTED_UNSTAKES = [...UNSTAKE_EVENTS];
    }
  
    // Filter for active stakes
    const ACTIVE_STAKES = STAKE_EVENTS.filter(se => UNSTAKE_EVENTS.findIndex(ue => +ue.stakeNum === +se.stakeNum) === -1)

    // Build the result
    const RESULT = {
        stakes: ACTIVE_STAKES.length,
        total_staked_bn: ACTIVE_STAKES.reduce((a, b) => a + +b.amount, 0).toLocaleString('fullwide', { useGrouping: false }),
        total_shares_bn: ACTIVE_STAKES.reduce((a, b) => a + +b.shares, 0).toLocaleString('fullwide', { useGrouping: false }),
        last_event_block: Math.max(SORTED_STAKES[0].block, SORTED_UNSTAKES[0].block)
    }

    res.status(200).send(RESULT)
})

module.exports = staking_router;