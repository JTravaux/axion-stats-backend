require('dotenv').config();
const cors = require('cors');
const express = require('express');
const eco_routes = require('./routes/eco_routes');
const base_routes = require('./routes/base_routes');
const staking_routes = require('./routes/staking_routes');
const market_stats_routes = require('./routes/market_stats_routes');

const app = express(); 
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use('/', base_routes);
app.use('/eco', eco_routes);
app.use('/staking', staking_routes);
app.use('/stats', market_stats_routes);

app.listen(PORT, () => console.log(`AxionStats API is now online.`));