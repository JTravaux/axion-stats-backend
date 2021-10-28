const fetch = require('node-fetch');
const { getLiquidEcoData } = require('./holders')
const { Fetcher, ChainId, Route, Trade, TokenAmount, TradeType, Token } = require('@sushiswap/sdk');
const { ONE_TOKEN_18, PROVIDER, AXION, WETH, COINGECKO_TOKEN_INFO_ENDPOINT, CONTRACTS, web3, DAI_CONTRACT, DAI } = require('../config');

// METHODS
let usdtPrice = null;

const _getUpdateSupplyEtherscan = () => {
    return new Promise((res, rej) => {
        CONTRACTS.token.methods.totalSupply().call().then(supply => {
            const ADJUSTED_SUPPLY = web3.utils.toBN(supply).div(web3.utils.toBN(ONE_TOKEN_18)).toNumber();
            res(ADJUSTED_SUPPLY)
        }).catch(err => {
            rej(err)
        })
    })
}

const getEthUsdPrice = () => {
    return new Promise(async (resolve, reject) => {
        try {
            resolve({ usd: 0 });

            // console.log("getEthUsdPrice")
            // const pair = await Fetcher.fetchPairData(DAI, WETH, PROVIDER)
            // const route = new Route([pair], WETH)
            // console.log("getEthUsdPrice", route.midPrice.toSignificant(6))
            // resolve({ usd: route.midPrice.toSignificant(6) });
        } catch (err) { reject(err) }
    })
}

const getAxnPerEth = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log("getAxnPerEth")
            // const PAIR = await Fetcher.fetchPairData(WETH, AXION, PROVIDER);
            // console.log("getAxnPerEth 1")
            // const TRADE = new Trade(
            //     new Route([PAIR], WETH),
            //     new TokenAmount(WETH, ONE_TOKEN_18),
            //     TradeType.EXACT_INPUT
            // )
            // console.log("getAxnPerEth", TRADE.executionPrice.toSignificant(6))
            resolve({ axn: 0});

            // resolve({ axn: TRADE.executionPrice.toSignificant(6) });
        } catch (err) { reject(err) }
    })
}

const getUsdtPerAxnCoingecko = () => {
     return new Promise(async (resolve, reject) => {
        try {
            const RES = await fetch(COINGECKO_TOKEN_INFO_ENDPOINT);
            const RES_JSON = await RES.json();
            resolve(RES_JSON.market_data.current_price.usd)
        } catch (err) { reject(err) }
    })
}

const getUsdtPerAxn = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // let AXIONwETHPair = await Fetcher.fetchPairData(AXION, WETH[ChainId.MAINNET], PROVIDER)
            // let wETHUSDTPair = await Fetcher.fetchPairData(WETH[ChainId.MAINNET], USDT, PROVIDER)

            // const TRADE = new Trade(
            //     new Route([AXIONwETHPair, wETHUSDTPair], AXION),
            //     new TokenAmount(AXION, `${ONE_TOKEN_18}00`),
            //     TradeType.EXACT_INPUT
            // )

            // usdtPrice = TRADE.executionPrice.toSignificant(6);
            usdtPrice = await getUsdtPerAxnCoingecko();
            resolve({usdt: usdtPrice})
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
    return new Promise(async (resolve, reject) => {
        try {
            const supply = await _getUpdateSupplyEtherscan();
            CONTRACTS.token.methods.balanceOf("0x000000000000000000000000000000000000dead").call().then(burnt => {
                const ADJUSTED_SUPPLY = supply - (burnt / 1e18)
                resolve({ total_supply: ADJUSTED_SUPPLY });
            })
        }
        catch (err) { reject(err) }
    })
}

const getVolume = () => {
    return new Promise((resolve, reject) => {
        fetch(COINGECKO_TOKEN_INFO_ENDPOINT).then(result => {
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
    getEthUsdPrice,
    getFixedLiquidAxn,
}