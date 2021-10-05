const fs = require("fs");
const { CONTRACTS, ONE_TOKEN_18 , web3 } = require('../config');
const { uniqueify, readFile, saveToFile } = require('../helpers');

const CONTRACT_FIRST_BLOCK = 11248075;
const STAKE_UPGRADES_FILE = "data/stake_upgrades_raw.json";
const STAKE_EVENTS_FILE = "data/stake_events_raw.json";
const UNSTAKE_EVENTS_FILE = "data/unstake_events_raw.json";

const _saveEvents = (path, events) => {
    const SORTED_EVENTS = events.sort((a, b) => b.block - a.block);
    fs.writeFile(path, JSON.stringify(SORTED_EVENTS), (err) => {
        if (err) console.log(err);
    });
}

const _cleanData = (data, type) => {

    let dat = [...data];
    if (type === "Stake")
        dat = dat.filter(d => +d.returnValues.sessionId >= 23439)

    return dat.map(d => {
        return {
            address: d.returnValues.account,
            stakeNum: +d.returnValues.sessionId,
            amount: d.returnValues.amount,
            start: +d.returnValues.start,
            end: +d.returnValues.end,
            shares: d.returnValues.shares,
            block: +d.blockNumber,
            txID: d.transactionHash
        }
    })
}

const _cleanDataV1 = (data, type) => {

    let dat = [...data];
    if (type === "Stake")
        dat = dat.filter(d => +d.returnValues.sessionId <= 23438)

    return dat.map(d => {
        return {
            address: d.returnValues.account,
            stakeNum: +d.returnValues.sessionId,
            amount: d.returnValues.amount,
            start: +d.returnValues.start,
            end: +d.returnValues.end,
            shares: d.returnValues.shares,
            block: +d.blockNumber,
            txID: d.transactionHash
        }
    })
}

const _getEvents = async (
    type = 'Stake',
    contract = "staking",
    startBlock = 11472615, // v2 start
    endBlock = "latest",
    step = 10000,
    clean = true,
) => {

    if (endBlock === 'latest') {
        endBlock = await web3.eth.getBlockNumber();
    }

    let fromBlock = startBlock;
    let toBlock = endBlock;
    const between = endBlock - startBlock;
    if (between > step) {
        toBlock = startBlock + step;
    }

    console.log(`\nGetting ${type.toLowerCase()} events from '${contract}' contract...`);

    let events = [];
    while (toBlock <= endBlock) {
        try {
            console.log(fromBlock, toBlock)

            const queriedEvents = await CONTRACTS[contract].getPastEvents(type, { fromBlock, toBlock });

            events = [...events, ...queriedEvents];

            fromBlock = toBlock + 1;
            toBlock = fromBlock + step;

            if (toBlock > endBlock && fromBlock < endBlock) {
                toBlock = endBlock;
            }
        } catch (error) {
            console.log(error);
        }
    }

    let cleaned;
    if (clean) {
        if (contract === "staking_v1")
            cleaned = _cleanDataV1(events, type);
        else
            cleaned = _cleanData(events, type);
    } else
        cleaned = events

    return cleaned;
};

const _processEvents = (stake_events, unstake_events) => {
    let uniqueAddresses = [];
    let total_axn_staked = 0;
    let total_stake_length = 0;
    let total_active_shares = 0;
    let total_active_stakes_5555 = 0
    let total_axn_staked_5555 = 0;
    let total_active_stakes_5555_any = 0
    let total_axn_staked_5555_any = 0;
    let total_active_stakes = (stake_events.length - unstake_events.length);

    stake_events.forEach(ev => {
        if (unstake_events.find(ue => ue.stakeNum === ev.stakeNum)) 
            return;

        const amount = +ev.amount / ONE_TOKEN_18;
        const days = Math.floor((ev.end - ev.start) / 86400);
        const is5555 = days >= 5555;

        if (amount >= 2500000 && is5555) {
            total_active_stakes_5555++;
            total_axn_staked_5555 += amount
        }

        if (is5555) {
            total_active_stakes_5555_any++;
            total_axn_staked_5555_any += amount
        }

        if(!uniqueAddresses.includes(ev.address))
            uniqueAddresses.push(ev.address)

        total_active_shares += ev.shares / ONE_TOKEN_18; 
        total_stake_length += days;
        total_axn_staked += amount;
    })

    return {
        total_axn_staked,
        total_active_shares,
        total_active_stakes,
        total_axn_staked_5555,
        total_active_stakes_5555,
        total_axn_staked_5555_any,
        total_active_stakes_5555_any,
        
        unique_holders: uniqueAddresses.length,
        avg_axn: total_axn_staked / total_active_stakes,
        avg_days: total_stake_length / total_active_stakes
    }
}

const _calculateStakingStats = async () => {

    // Get saved stakes & unstakes from file
    const SAVED_EVENTS = await Promise.all([ 
        readFile(STAKE_EVENTS_FILE), 
        readFile(UNSTAKE_EVENTS_FILE) 
    ])

    let lastSavedStakeEventBlock = CONTRACT_FIRST_BLOCK;
    let lastSavedUnstakeEventBlock = CONTRACT_FIRST_BLOCK;

    if(SAVED_EVENTS[0].length > 0)
        lastSavedStakeEventBlock = SAVED_EVENTS[0][0].block;
    if (SAVED_EVENTS[1].length > 0)
        lastSavedUnstakeEventBlock = SAVED_EVENTS[1][0].block;

    // Get updated stakes & unstakes from last saved block
    const NEW_EVENTS = await Promise.all([
        _getEvents("Stake", "staking", lastSavedStakeEventBlock + 1, 'latest'), 
        _getEvents("Unstake", "staking", lastSavedUnstakeEventBlock + 1, 'latest') 
    ])

    const ALL_STAKE_EVENTS = uniqueify([...SAVED_EVENTS[0], ...NEW_EVENTS[0]]);
    const ALL_UNSTAKE_EVENTS = uniqueify([...SAVED_EVENTS[1], ...NEW_EVENTS[1]]);
    
    _saveEvents(STAKE_EVENTS_FILE, ALL_STAKE_EVENTS);
    _saveEvents(UNSTAKE_EVENTS_FILE, ALL_UNSTAKE_EVENTS);

    // Return the results
    let results = _processEvents(ALL_STAKE_EVENTS, ALL_UNSTAKE_EVENTS);
    results["block"] = Math.max(lastSavedStakeEventBlock+1, lastSavedUnstakeEventBlock+1);
    results["timestamp"] = Date.now();

    // Get total staked
    const totalStakedAmount = await getTotalStaked();
    results["total_axn_staked"] = totalStakedAmount / ONE_TOKEN_18

    return results;
}

const getStakingStats = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const RESULTS = await _calculateStakingStats();
            resolve(RESULTS);
        } catch (err) { reject(err) }
    })
}

const getActiveStakesByAddress = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            let unique_addresses = {}
            const STAKE_EVENTS = await readFile(STAKE_EVENTS_FILE);
            const UNSTAKE_EVENTS = await readFile(UNSTAKE_EVENTS_FILE);

            STAKE_EVENTS.filter(s => !UNSTAKE_EVENTS.find(u => +u.stakeNum === +s.stakeNum)).forEach(e => {
                if (!unique_addresses[e.address])
                    unique_addresses[e.address] = [e]
                else
                    unique_addresses[e.address].push(e)
            })

            resolve(unique_addresses);
        } catch (err) { reject(err) }
    })
}

const getCompletedStakesByAddress = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            let unique_addresses = {}
            const UNSTAKE_EVENTS = await readFile(UNSTAKE_EVENTS_FILE);

            UNSTAKE_EVENTS.forEach(e => {
                if (!unique_addresses[e.address])
                    unique_addresses[e.address] = [e]
                else
                    unique_addresses[e.address].push(e)
            })

            resolve(unique_addresses);
        } catch (err) { reject(err) }
    })
}


const getStakeUnstakeEvents = async (num) => {
    return new Promise(async (resolve, reject) => {
        try {
            const STAKE_EVENTS = await readFile(STAKE_EVENTS_FILE);
            const STAKE_EVENTS_ADJUSTED = STAKE_EVENTS.map(s => {
                s.type = "Stake";
                return s;
            })

            const UNSTAKE_EVENTS = await readFile(UNSTAKE_EVENTS_FILE);
            const UNSTAKE_EVENTS_ADJUSTED = UNSTAKE_EVENTS.map(s => {
                s.type = "Unstake";
                return s;
            })

            const EVENTS = [...STAKE_EVENTS_ADJUSTED, ...UNSTAKE_EVENTS_ADJUSTED].sort((a, b) => b.block - a.block)
            resolve(EVENTS.slice(0, num))
        } catch (err) { reject(err) }
    })
}

const updateMaxSharesData = async () => {

    // Get saved events
    const CURRENT_STAKE_UPGRADES_EVENTS = await readFile(STAKE_UPGRADES_FILE);
    let maxSharesStartBlock = 11818550;
    if (CURRENT_STAKE_UPGRADES_EVENTS.length > 0)
        maxSharesStartBlock = CURRENT_STAKE_UPGRADES_EVENTS[0].blockNumber;

    // Get new events
    const NEW_MAX_SHARES_EVENTS = await _getEvents("MaxShareUpgrade", "staking", maxSharesStartBlock + 1, 'latest', 10000, false);
    const uniqueConcat = uniqueify(CURRENT_STAKE_UPGRADES_EVENTS.concat(NEW_MAX_SHARES_EVENTS))
    const sortedUpgradeEvents = uniqueConcat.sort((a, b) => b.blockNumber - a.blockNumber);
    await saveToFile(STAKE_UPGRADES_FILE, sortedUpgradeEvents)

    // Upgrade the stakes
    let stakeEvents = await readFile(STAKE_EVENTS_FILE);

    for (let stake of stakeEvents) {
        const idx = sortedUpgradeEvents.findIndex(e => +e.returnValues.sessionId === stake.stakeNum)
        if (idx !== -1) {
            stake.amount = sortedUpgradeEvents[idx].returnValues.newAmount;
            stake.shares = sortedUpgradeEvents[idx].returnValues.newShares;
            stake.start = +sortedUpgradeEvents[idx].returnValues.start;
            stake.end = +sortedUpgradeEvents[idx].returnValues.end;
        }
    }

    await saveToFile(STAKE_EVENTS_FILE, uniqueify(stakeEvents))
    return NEW_MAX_SHARES_EVENTS;
}


const V1_START_BLOCK = 11248075;
const V1_END_BLOCK = 11472614;
const updateStakeEventsData = async () => {
    const stakes_v1 = await _getEvents("Stake", "staking_v1", V1_START_BLOCK, V1_END_BLOCK)
    const stakes_v2 = await _getEvents("Stake")
    STAKE_EVENTS = stakes_v1.concat(stakes_v2).sort((a, b) => +b.block - +a.block);
    await saveToFile(STAKE_EVENTS_FILE, STAKE_EVENTS)
    return STAKE_EVENTS;
}

const updateUnstakeEventsData = async () => {
    const unstakes_v1 = await _getEvents("Unstake", "staking_v1", V1_START_BLOCK, V1_END_BLOCK)
    const unstakes_v2 = await _getEvents("Unstake")
    UNSTAKE_EVENTS = unstakes_v1.concat(unstakes_v2).sort((a, b) => +b.block - +a.block);
    await saveToFile(UNSTAKE_EVENTS_FILE, UNSTAKE_EVENTS)
    return UNSTAKE_EVENTS;
}

const getTotalShares = () => CONTRACTS.staking.methods.sharesTotalSupply().call();
const getTotalStaked = () => CONTRACTS.staking.methods.totalStakedAmount().call();
const getShareRate = () => CONTRACTS.staking.methods.shareRate().call();

module.exports = {
    _getEvents,
    getShareRate,
    getTotalStaked,
    getTotalShares,
    getStakingStats,
    updateMaxSharesData,
    updateStakeEventsData,
    getStakeUnstakeEvents,
    updateUnstakeEventsData,
    getActiveStakesByAddress,
    getCompletedStakesByAddress,
}