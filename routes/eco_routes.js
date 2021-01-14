const { calculateEcosystem } = require('../controllers/ecosystem');
const express = require('express');
const eco_router = express.Router();

let levelsCache;
let levelsUpdater;
eco_router.get('/totals', async (req, res) => {    
    try {
        if (!levelsUpdater) {
            const RESULT = await calculateEcosystem();
            levelsCache = RESULT;
            levelsUpdater = setInterval(async () => {
                levelsCache = await calculateEcosystem()
            }, (1000 * 60) * 10)
            res.status(200).send(RESULT)
        } else
            res.status(200).send(levelsCache)
    } catch (err) {
        console.log(err);
        clearInterval(levelsUpdater);
        res.status(500).send({message: err.message})
    }
})

module.exports = eco_router;