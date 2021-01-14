const { getEstimatedTrees, getCurrentAuctionReserves, getAuctions, getCurrentAuctionEnd, getWeeklyAuctionAXN } = require('../controllers/auction');

const express = require('express');
const auction_router = express.Router();

const AUTO_UPDATING_MINUTES = 5;

auction_router.get('/trees', async (req, res) => {
    try {
        const results = await getEstimatedTrees();
        res.status(200).send(results)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

auction_router.get('/weekly', async (req, res) => {
    try {
        const results = await getWeeklyAuctionAXN();
        res.status(200).send(results)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

let auctionReservesCache;
let auctionReservesUpdater;
auction_router.get('/current', async (req, res) => {
    try {
        if (!auctionReservesUpdater) {
            const result = await getCurrentAuctionReserves();
            auctionReservesCache = result

            auctionReservesUpdater = setInterval(() => {
                getCurrentAuctionReserves().then(res => { auctionReservesCache = res }).catch(() => clearInterval(auctionReservesUpdater))
            }, (1000 * 60) * AUTO_UPDATING_MINUTES)

            res.status(200).send(result)
        } else
            res.status(200).send(auctionReservesCache)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

let auctionCache;
let auctionUpdater;
auction_router.get('/auctions', async (req, res) => {
    try {
        if (!auctionUpdater) {
            const result = await getAuctions();
            auctionCache = result

            auctionUpdater = setInterval(() => {
                getAuctions().then(res => { auctionCache = res }).catch(() => clearInterval(auctionUpdater))
            }, (1000 * 60) * AUTO_UPDATING_MINUTES)

            res.status(200).send(result)
        } else
            res.status(200).send(auctionCache)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

auction_router.get('/countdown', async (req, res) => {
    const result = await getCurrentAuctionEnd();
    res.status(200).send(result)
})

module.exports = auction_router;