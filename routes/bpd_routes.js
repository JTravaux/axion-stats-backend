const { getPaydayAmounts, getNextPaydayAmount } = require('../controllers/bpd');

const express = require('express');
const bpd_router = express.Router();

bpd_router.get('/pools', async (req, res) => {
    try {
        const amount = await getPaydayAmounts();
        res.status(200).send(amount)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

bpd_router.get('/next', async (req, res) => {
    try {
        const amount = await getNextPaydayAmount();
        res.status(200).send(amount)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})


module.exports = bpd_router;