const moment = require('moment');
const fetch = require('node-fetch');
const { saveToFile, readFile } = require('../helpers');
const { Fetcher, Route, WETH} = require('@uniswap/sdk');
const { USDT, BLOXY_GET_WEEKLY_AUCTION_BALANCE, PROVIDER, CONTRACTS, ONE_TOKEN_18 } = require('../config');

const AUCTION_HISTORY_FILE = "data/auction_history.json";

const getEstimatedTrees = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Get ETH Price
            const pair = await Fetcher.fetchPairData(USDT, WETH[USDT.chainId], PROVIDER)
            const ethPrice = new Route([pair], WETH[USDT.chainId]).midPrice.toSignificant(6);

            // Get ETH Balance
            const AUCTIONS = await readFile(AUCTION_HISTORY_FILE)
            const TOTAL_ETH = AUCTIONS.reduce((acc, auction) => acc + auction.eth, 0)

            // Calculate Trees
            const ONE_PERCENT_ETH = TOTAL_ETH * 0.01;
            const USDT_FOR_TREES = ONE_PERCENT_ETH * +ethPrice;

            // Save result and block number to
            resolve({ 
                trees: Math.floor(USDT_FOR_TREES / 0.10), 
                amount: USDT_FOR_TREES,
                eth: ONE_PERCENT_ETH
            })
        } catch (err) { reject(err) }
    })
}

const getAuctions = () => {
    return new Promise(async (resolve, reject) => {
        const AUCTIONS = await readFile(AUCTION_HISTORY_FILE)
        resolve(AUCTIONS)
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
    getCurrentAuctionEnd,
    getCurrentAuctionReserves,
}