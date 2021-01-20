const { getEstimatedTrees, getCurrentAuctionReserves, getAuctions, getCurrentAuctionEnd } = require('../controllers/auction');
const express = require('express');
const auction_router = express.Router();

const FINE_MINUTES = 300000;
const ONE_SECOND = 1000;

let treeCache;
auction_router.get('/trees', async (req, res) => {
    try {
        if (!treeCache) {
            treeCache = await getEstimatedTrees();
            setInterval(async () => { 
                treeCache = await getEstimatedTrees() 
            }, (FINE_MINUTES + (ONE_SECOND * 5)))
            res.status(200).send(treeCache);
        } else
            res.status(200).send(treeCache)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

let auctionReservesCache;
auction_router.get('/current', async (req, res) => {
    try {
        if (!auctionReservesCache) {
            auctionReservesCache = await getCurrentAuctionReserves();
            setInterval(async () => {
                auctionReservesCache = await getCurrentAuctionReserves()
            }, (FINE_MINUTES + (ONE_SECOND * 10)))
            res.status(200).send(auctionReservesCache)
        } else
            res.status(200).send(auctionReservesCache)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

let auctionCache;
auction_router.get('/auctions', async (req, res) => {
    try {
        if (!auctionCache) {
            auctionCache = await getAuctions();
            setInterval(async () => {
                auctionCache = await getAuctions()
            }, (FINE_MINUTES + (ONE_SECOND * 15)))
            res.status(200).send(auctionCache)
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