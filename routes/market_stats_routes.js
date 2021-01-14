const { getAxnPerEth, getUsdtPerAxn, getVolume, getMarketCap, getTotalSupply, getFixedLiquidAxn } = require('../controllers/market_data');

const express = require('express');
const holder_router = express.Router();

const AUTO_UPDATING_TIME = 10000;

let axnEthCache;
let axnEthUpdater;
holder_router.get('/axn-eth', async (req, res) => {
    try {
        if(!axnEthUpdater) {
            const result = await getAxnPerEth();
            axnEthCache = result

            axnEthUpdater = setInterval(() => { 
                getAxnPerEth().then(res => { axnEthCache = res }).catch(() => clearInterval(axnEthUpdater)) 
            }, AUTO_UPDATING_TIME)

            res.status(200).send(result)
        } else
            res.status(200).send(axnEthCache)
    } catch (err) { 
        console.log(err)
        res.sendStatus(500);
    }
})

let usdtAxnCache;
let usdtAxnUpdater;
holder_router.get('/usdt-axn', async (req, res) => {
    try {
        if (!usdtAxnUpdater) {
            const result = await getUsdtPerAxn();
            usdtAxnCache = result

            usdtAxnUpdater = setInterval(() => { 
                getUsdtPerAxn().then(res => { usdtAxnCache = res }).catch(() => clearInterval(usdtAxnUpdater)) 
            }, AUTO_UPDATING_TIME)

            res.status(200).send(result)
        } else
            res.status(200).send(usdtAxnCache)
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

let volumeCache;
let volumeUpdater;
holder_router.get('/volume', async (req, res) => {
    try {
        if (!volumeUpdater) {
            const result = await getVolume();
            volumeCache = result

            volumeUpdater = setInterval(() => { 
                getVolume().then(res => { volumeCache = res }).catch(() => clearInterval(volumeUpdater)) 
            }, AUTO_UPDATING_TIME)

            res.status(200).send(result)
        } else
            res.status(200).send(volumeCache)
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

let marketCapCache;
let marketCapUpdater;
holder_router.get('/market-cap', async (req, res) => {
    try {
        if (!marketCapUpdater) {
            const result = await getMarketCap();
            marketCapCache = result

            marketCapUpdater = setInterval(() => { 
                getMarketCap().then(res => { marketCapCache = res }).catch(() => clearInterval(marketCapUpdater)) 
            }, AUTO_UPDATING_TIME)

            res.status(200).send(result)
        } else
            res.status(200).send(marketCapCache)
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

let supplyCache;
let supplyUpdater;
holder_router.get('/total-supply', async (req, res) => {
    try {
        if (!supplyUpdater) {
            const result = await getTotalSupply();
            supplyCache = result

            supplyUpdater = setInterval(() => { 
                getTotalSupply().then(res => { supplyCache = res }).catch(() => clearInterval(supplyUpdater)) 
            }, AUTO_UPDATING_TIME)

            res.status(200).send(result)
        } else
            res.status(200).send(supplyCache)
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})


let supplyFixCache;
let supplyFixUpdater;
holder_router.get('/fixed-supply', async (req, res) => {
    try {
        if (!supplyFixUpdater) {
            const result = await getFixedLiquidAxn();
            supplyFixCache = result

            supplyFixUpdater = setInterval(() => {
                getFixedLiquidAxn().then(res => { supplyFixCache = res }).catch(() => clearInterval(supplyFixUpdater))
            }, AUTO_UPDATING_TIME)

            res.status(200).send(result)
        } else
            res.status(200).send(supplyFixCache)
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

module.exports = holder_router;