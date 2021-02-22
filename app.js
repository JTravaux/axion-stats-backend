require('dotenv').config();
const cors = require('cors');
const path = require('path');
const express = require('express');
const bpd_routes = require('./routes/bpd_routes');
const eco_routes = require('./routes/eco_routes');
const base_routes = require('./routes/base_routes');
const auction_routes = require('./routes/auction_routes');
const staking_routes = require('./routes/staking_routes');
const freeclaim_routes = require('./routes/freeclaim_routes');
const market_stats_routes = require('./routes/market_stats_routes');

const app = express(); 
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use('/', base_routes);
app.use('/eco', eco_routes);
app.use('/bpd', bpd_routes);
app.use('/auction', auction_routes);
app.use('/staking', staking_routes);
app.use('/stats', market_stats_routes);
app.use('/freeclaim', freeclaim_routes);
app.use(express.static(path.join(__dirname, './frontend')));

app.listen(PORT, () => console.log(`AxionStats API is now online.`));