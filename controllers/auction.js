const moment = require('moment');
const fetch = require('node-fetch');
const { saveToFile, readFile, uniqueify } = require('../helpers');
const { Fetcher, Route, WETH} = require('@uniswap/sdk');
const { USDT, BLOXY_GET_ETH_BALANCE, BLOXY_GET_WEEKLY_AUCTION_BALANCE, PROVIDER, CONTRACTS, ONE_TOKEN_18, JACK_ADDRESS_OLD_AMOUNT } = require('../config');

let lastEthPrice = 0;
let lastEthBalance = 0;
let ethPriceUpdater = null;
let ethBalanceUpdater = null;
const AUCTION_HISTORY_FILE = "data/auction_history.json";

// METHODS
const _startETHPriceAutoUpdater = () => {
    ethPriceUpdater = setInterval(async () => {
        try {
            const pair = await Fetcher.fetchPairData(USDT, WETH[USDT.chainId], PROVIDER)
            lastEthPrice = new Route([pair], WETH[USDT.chainId]).midPrice.toSignificant(6);
        } catch (err) {
            clearInterval(ethPriceUpdater);
            ethPriceUpdater = null;
        }
    }, 1000 * (60 * 10)) // 10 minutes
}

const _startBalanceAutoUpdater = () => {
    ethBalanceUpdater = setInterval(async () => {
        try {
            const RES = await fetch(BLOXY_GET_ETH_BALANCE);
            const RES_JSON = await RES.json()
            lastEthBalance = RES_JSON[0].received_amount += JACK_ADDRESS_OLD_AMOUNT;
        } catch (err) {
            clearInterval(ethBalanceUpdater);
            ethBalanceUpdater = null;
        }
    }, 1000 * (60 * 1)) // 1 minute
}

const getEstimatedTrees = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Get ETH Price
            if (!ethPriceUpdater) {
                const pair = await Fetcher.fetchPairData(USDT, WETH[USDT.chainId], PROVIDER)
                lastEthPrice = new Route([pair], WETH[USDT.chainId]).midPrice.toSignificant(6);
                _startETHPriceAutoUpdater();
            }

            // Get ETH Balance
            if (!ethBalanceUpdater) {
                const RES = await fetch(BLOXY_GET_ETH_BALANCE);
                const RES_JSON = await RES.json()
                lastEthBalance = RES_JSON[0].received_amount += JACK_ADDRESS_OLD_AMOUNT;
                _startBalanceAutoUpdater();
            }

            // Calculate Trees
            const FIVE_PERCENT_ETH = lastEthBalance * 0.05;
            const USDT_FOR_TREES = FIVE_PERCENT_ETH * Number(lastEthPrice);

            // Save result and block number to
            resolve({ 
                trees: Math.floor(USDT_FOR_TREES / 0.10), 
                amount: USDT_FOR_TREES,
                eth: FIVE_PERCENT_ETH
            })
        } catch (err) { reject(err) }
    })
}

const getWeeklyAuctionAXN = () => {
    return new Promise(async (resolve, reject) => {
        const result = await fetch(BLOXY_GET_WEEKLY_AUCTION_BALANCE);
        const resultJSON = await result.json();
        const AXN_BALANCE = resultJSON[0].balance;
        resolve({axn: AXN_BALANCE})
    })
}

const getAuctions = () => {
    return new Promise(async (resolve) => {
        try {
            // Get previous auctions
            const AUCTIONS = await readFile(AUCTION_HISTORY_FILE)

            const CURRENT_AUCTION_ID = AUCTIONS[AUCTIONS.length - 2].id;
            const TOMORROW_AUCTION_ID = AUCTIONS[AUCTIONS.length - 1].id;

            // Get new auctions
            let promises = [];
            promises.push(CONTRACTS.auction.methods.reservesOf(CURRENT_AUCTION_ID).call())
            promises.push(CONTRACTS.auction.methods.reservesOf(TOMORROW_AUCTION_ID).call())

            const NEW_AUCTIONS = await Promise.all(promises);
            const NEW_AUCTIONS_FORMATTED = NEW_AUCTIONS.map((a, i) => {
                return {
                    id: CURRENT_AUCTION_ID + i,
                    isWeekly: (i + 1) % 7 === 0,
                    eth: Number(a.eth) / ONE_TOKEN_18,
                    axn: Number(a.token) / ONE_TOKEN_18,
                    start: moment.unix(1605337416).add(i, 'days').format("X"),
                    end: moment.unix(1605337416).add(i + 1, 'days').format("X")
                }
            })

            AUCTIONS[AUCTIONS.length - 2] = NEW_AUCTIONS_FORMATTED[0];
            AUCTIONS[TAUCTIONS.length - 1] = NEW_AUCTIONS_FORMATTED[1];

            saveToFile(AUCTION_HISTORY_FILE, AUCTIONS)
            resolve(AUCTIONS)
        } catch (err) {
            CONTRACTS.auction.methods.lastAuctionEventId().call().then(async (id) => {
                let promises = [];
                for (let i = 0; i <= id; ++i)
                    promises.push(CONTRACTS.auction.methods.reservesOf(i + 1).call())

                const auctions = await Promise.all(promises)
                const FORMATTED_AUCTIONS = auctions.map((a, i) => {
                    return {
                        id: i + 1,
                        isWeekly: (i + 1) % 7 === 0,
                        eth: Number(a.eth) / ONE_TOKEN_18,
                        axn: Number(a.token) / ONE_TOKEN_18,
                        start: moment.unix(1605337416).add(i, 'days').format("X"),
                        end: moment.unix(1605337416).add(i + 1, 'days').format("X")
                    }
                })
                saveToFile(AUCTION_HISTORY_FILE, FORMATTED_AUCTIONS)
                resolve(FORMATTED_AUCTIONS)
            }).catch(err => reject(err))
        }
    })
}

const getCurrentAuctionReserves = () => {
    return new Promise(async (resolve, reject) => {
        let id;

        try {
            const AUCTIONS = await readFile(AUCTION_HISTORY_FILE)
            id = AUCTIONS[AUCTIONS.length - 2].id;
        } catch (e) { id = await CONTRACTS.auction.methods.calculateStepsFromStart().call() }
       
        CONTRACTS.auction.methods.reservesOf(id).call().then(reserves => {
            const nextWeeklyAuctionId = 7 * Math.ceil(id / 7);
            CONTRACTS.auction.methods.reservesOf(nextWeeklyAuctionId).call().then(nextWeekly => {
                resolve({
                    timestamp: Date.now(),
                    axn: (Number(reserves.token) / ONE_TOKEN_18).toFixed(2),
                    eth: (Number(reserves.eth) / ONE_TOKEN_18).toFixed(2),
                    next_weekly: (Number(nextWeekly.token) / ONE_TOKEN_18).toFixed(2),
                })
            }).catch(err => reject(err))
        }).catch(err => reject(err))
    })
}

// 0xe95aa33a946d533940832ebfd6fa53fe95e12060
// START: 1605250994
const getCurrentAuctionEnd = () => {
    return new Promise((resolve, reject) => {
        CONTRACTS.auction.methods.lastAuctionEventId().call().then(async (id) => {
            const startDateTime = moment(1605251016) // 2:03:36 renewal time
            const endAuction = startDateTime + (id * 86400)
            const currentAuctionEnd = moment(endAuction* 1000);
            
            resolve({ 
                end_raw: currentAuctionEnd.unix(),
                end_format: currentAuctionEnd.format("MMM Do, YYYY h:mm:ss")
            })
        }).catch(err => reject(err))
    })
}


module.exports = {
    getAuctions,
    getEstimatedTrees,
    getWeeklyAuctionAXN,
    getCurrentAuctionEnd,
    getCurrentAuctionReserves,
}