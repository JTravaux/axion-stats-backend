const express = require('express');
const base_router = express.Router();

base_router.get('/', (req, res) => {
    res.status(200).send("Welcome to api.axionstats.info!")
})

module.exports = base_router;