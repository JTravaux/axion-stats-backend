const fs = require("fs");
const { CONTRACTS, ONE_TOKEN_18 , web3 } = require('../config');
const { uniqueify, readFile, saveToFile } = require('../helpers');

const CONTRACT_FIRST_BLOCK = 20391199;
const STAKE_EVENT_NAME = 'StakeCreated';
const UNSTAKE_EVENT_NAME = 'StakeDeleted';
const STAKE_UPGRADES_FILE = "data/stake_upgrades_raw.json";
const STAKE_EVENTS_FILE = "data/stake_events_raw.json";
const UNSTAKE_EVENTS_FILE = "data/unstake_events_raw.json";

const _saveEvents = (path, events) => {
    const SORTED_EVENTS = events.sort((a, b) => b.block - a.block);
    fs.writeFile(path, JSON.stringify(SORTED_EVENTS), (err) => {
        if (err) console.log(err);
    });
}

const _cleanData = (data) => {
    let dat = [...data];
    return dat.map(d => {
        return {
            block: +d.blockNumber,
            txID: d.transactionHash,
            start: +d.returnValues.start,
            shares: d.returnValues.shares * 1e12,
            amount: d.returnValues.amount * 1e12,
            address: d.returnValues.account,
            days: +d.returnValues.stakingDays,
            stakeNum: +d.returnValues.sessionId,
            end: +d.returnValues.start + (+d.returnValues.stakingDays * 86400),
        }
    })
}

const _getEvents = async (
    type = STAKE_EVENT_NAME,
    contract = "staking",
    startBlock = CONTRACT_FIRST_BLOCK,
    endBlock = "latest",
    step = 1000,
    clean = true,
) => {
    if (endBlock === 'latest') endBlock = await web3.eth.getBlockNumber();

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
            // console.log(fromBlock, toBlock)

            const queriedEvents = await CONTRACTS[contract].getPastEvents(type, { fromBlock, toBlock });
            events = [...events, ...queriedEvents];
            fromBlock = toBlock + 1;
            toBlock = fromBlock + step;

            if (toBlock > endBlock && fromBlock < endBlock) toBlock = endBlock;
        } catch (error) {
            console.log(error);
        }
    }

    console.log("Loop End")

    let cleaned = events;
    if (clean) cleaned = _cleanData(events);

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

    if (SAVED_EVENTS[0].length > 0) lastSavedStakeEventBlock = SAVED_EVENTS[0][0].block;
    if (SAVED_EVENTS[1].length > 0) lastSavedUnstakeEventBlock = SAVED_EVENTS[1][0].block;

    // Get updated stakes & unstakes from last saved block
    const NEW_EVENTS = await Promise.all([
        _getEvents(STAKE_EVENT_NAME, "staking", lastSavedStakeEventBlock + 1, 'latest'), 
        _getEvents(UNSTAKE_EVENT_NAME, "staking", lastSavedUnstakeEventBlock + 1, 'latest') 
    ])

    const ALL_STAKE_EVENTS = uniqueify([...SAVED_EVENTS[0], ...NEW_EVENTS[0]]);
    const ALL_UNSTAKE_EVENTS = uniqueify([...SAVED_EVENTS[1], ...NEW_EVENTS[1]]);
    
    _saveEvents(STAKE_EVENTS_FILE, ALL_STAKE_EVENTS);
    _saveEvents(UNSTAKE_EVENTS_FILE, ALL_UNSTAKE_EVENTS);

    // Return the results
    let results = _processEvents(ALL_STAKE_EVENTS, ALL_UNSTAKE_EVENTS);
    results["block"] = Math.max(lastSavedStakeEventBlock + 1, lastSavedUnstakeEventBlock + 1);
    results["timestamp"] = Date.now();

    // Get total staked
    const totalStakedAmount = await getTotalStaked();
    results["total_axn_staked"] = totalStakedAmount / 1e6

    const totalShareAmount = await getTotalShares();
    results["total_active_shares"] = totalShareAmount / 1e6

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
                if (!unique_addresses[e.address]) unique_addresses[e.address] = [e]
                else unique_addresses[e.address].push(e)
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
    const NEW_MAX_SHARES_EVENTS = await _getEvents("StakeUpgraded", "staking", maxSharesStartBlock + 1, 'latest', 10000, false);
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

const updateStakeEventsData = async () => {
    const stakes_v2 = await _getEvents(STAKE_EVENT_NAME)
    STAKE_EVENTS = stakes_v2.sort((a, b) => +b.block - +a.block);
    await saveToFile(STAKE_EVENTS_FILE, STAKE_EVENTS)
    return STAKE_EVENTS;
}

const updateUnstakeEventsData = async () => {
    const unstakes_v2 = await _getEvents(UNSTAKE_EVENT_NAME)
    UNSTAKE_EVENTS = unstakes_v2.sort((a, b) => +b.block - +a.block);
    await saveToFile(UNSTAKE_EVENTS_FILE, UNSTAKE_EVENTS)
    return UNSTAKE_EVENTS;
}

const getTotalShares = async () => {
    const stats = await CONTRACTS.staking.methods.getStatFields().call();
    return stats.sharesTotalSupply;
};

const getTotalStaked = async () => {
    const stats = await CONTRACTS.staking.methods.getStatFields().call();
    return stats.totalStakedAmount;
};

const getShareRate = async () => {
    const stats = await CONTRACTS.staking.methods.getInterestFields().call();
    return stats.shareRate;
};

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