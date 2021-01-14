const fetch = require('node-fetch');
const { getLiquidEcoData } = require('./holders')
const { Fetcher, ChainId, Route, WETH, Trade, TokenAmount, TradeType } = require('@uniswap/sdk');
const { ONE_TOKEN_18, PROVIDER, AXION, USDT, COINGECKO_VOLUME_INFO_ENDPOINT, CONTRACTS, BLOXY_TOKEN_INFO_ENDPOINT, web3 } = require('../config');

// METHODS
let usdtPrice = null;
let supplyAPI = 'bloxy' // or bloxy

const _getUpdateSupplyBloxy = () => {
    return new Promise(async (res, rej) => {
        try {
            const RES = await fetch(BLOXY_TOKEN_INFO_ENDPOINT);
            const RES_JSON = await RES.json();
            res(RES_JSON[0].circulating_supply)
        } catch (err) { 
            supplyAPI = "etherscan"
            setTimeout(() => { supplyAPI = "bloxy" }, 1000 * (60 * 5))
            rej(err) 
        }
    })
}

const _getUpdateSupplyEtherscan = () => {
    return new Promise((res, rej) => {
        CONTRACTS.token.methods.totalSupply().call().then(supply => {
            const ADJUSTED_SUPPLY = web3.utils.toBN(supply).div(web3.utils.toBN(ONE_TOKEN_18)).toNumber();
            res(ADJUSTED_SUPPLY)
        }).catch(err => {
            supplyAPI = "bloxy"
            setTimeout(() => { supplyAPI = "etherscan" }, 1000 * (60 * 30))
            rej(err)
        })
    })
}

const getAxnPerEth = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const PAIR = await Fetcher.fetchPairData(WETH[AXION.chainId], AXION, PROVIDER);
            const TRADE = new Trade(
                new Route([PAIR], WETH[AXION.chainId]),
                new TokenAmount(WETH[AXION.chainId], ONE_TOKEN_18),
                TradeType.EXACT_INPUT
            )
            
            resolve({ axn: TRADE.executionPrice.toSignificant(6) });
        } catch (err) { reject(err) }
    })
}

const getUsdtPerAxn = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let AXIONwETHPair = await Fetcher.fetchPairData(AXION, WETH[ChainId.MAINNET], PROVIDER)
            let wETHUSDTPair = await Fetcher.fetchPairData(WETH[ChainId.MAINNET], USDT, PROVIDER)

            const TRADE = new Trade(
                new Route([AXIONwETHPair, wETHUSDTPair], AXION),
                new TokenAmount(AXION, ONE_TOKEN_18),
                TradeType.EXACT_INPUT
            )

            usdtPrice = TRADE.executionPrice.toSignificant(6);
            resolve({usdt: TRADE.executionPrice.toSignificant(6)})
        } catch (err) { reject(err) }
    })
}

const getMarketCap = async () => {
    return new Promise(async (resolve, reject) => {
        const SUPPLY = await getTotalSupply();

        if (usdtPrice) {
            const MARKET_CAP = SUPPLY.total_supply * Number(usdtPrice);
            resolve({ market_cap: MARKET_CAP });
        } else {
            try {
                const PRICE = await getUsdtPerAxn();
                const MARKET_CAP = SUPPLY.total_supply * Number(PRICE.usdt)
                resolve({ market_cap: MARKET_CAP });
            } catch (err) { reject(err) }
        }
    })
}

const getTotalSupply = async () => {
    const supplyMethod = supplyAPI === 'etherscan' ? _getUpdateSupplyEtherscan : _getUpdateSupplyBloxy;
    return new Promise(async (resolve, reject) => {
        try {
            const supply = await supplyMethod();
            resolve({ total_supply: supply });
        }
        catch (err) { reject(err) }
    })
}

const getVolume = () => {
    return new Promise((resolve, reject) => {
        fetch(COINGECKO_VOLUME_INFO_ENDPOINT).then(result => {
            result.json().then(res => {
                resolve({ 
                    usd: res.market_data.total_volume.usd, 
                    eth: res.market_data.total_volume.eth
                });
            })
        }).catch(err => reject(err))
    })
}

const getFixedLiquidAxn = () => {
    return new Promise((resolve, reject) => {
        getLiquidEcoData().then(data => {
            const filteredData = [...data.filter(h => h.address_type === "Wallet" && h.address !== "0xe8b283b606a212d82036f74f88177375125440f6")]
            const adjustedLiquidAXN = filteredData.reduce((acc, curr) => acc + curr.balance, 0);
            resolve({ adjusted_liquid: adjustedLiquidAXN })
        }).catch(err => reject(err))
    })
}

module.exports = {
    getVolume,
    getMarketCap,
    getAxnPerEth,
    getUsdtPerAxn,
    getTotalSupply,
    getFixedLiquidAxn,
}