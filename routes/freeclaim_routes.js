const { getFreeclaimStats } = require('../controllers/freeclaim');
const express = require('express');
const freeclaim_router = express.Router();

let freeclaimCache;
let freeclaimUpdater;
freeclaim_router.get('/totals', async (req, res) => {    
    try {
        if (!freeclaimUpdater) {
            const RESULT = await getFreeclaimStats();
            freeclaimCache = RESULT;
            freeclaimUpdater = setInterval(async () => {
                freeclaimCache = await getFreeclaimStats()
            }, (1000 * 60) * 10)
            res.status(200).send(RESULT)
        } else
            res.status(200).send(freeclaimCache)
    } catch (err) {
        console.log(err);
        clearInterval(freeclaimUpdater);
        res.status(500).send({message: err.message})
    }
})

module.exports = freeclaim_router;