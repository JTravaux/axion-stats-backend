const { ethers } = require('ethers');
const { ChainId, Token } = require('@sushiswap/sdk');

const Web3 = require('web3');
const TOKEN_ABI = require('./ABIs/token.json');
const BPD_ABI = require('./ABIs/bpd.json');
const STAKING_ABI = require('./ABIs/staking.json');

const CHAIN_ID = 137;

const AXION_CONTRACT = "0x839f1a22a59eaaf26c85958712ab32f80fea23d9"; 
const BPD_CONTRACT = "0x5266f30d93e386df831e7081b7e58a513c8e7777"; 
const STAKING_CONTRACT = "0x5f95db799cecd1e9d95f66ba36a88a9a571db9cd";  // Stake Manager
const AUCTION_CONTRACT = "0xCc9bEC9EE79259C7757a24C288fB5CEAbC9ca40B" 
const USDT_CONTRACT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const DAI_CONTRACT = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063';
const WETH_CONTRACT = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619';

const JACK_ADDRESS_OLD_AMOUNT = 1255.948057; // 0xC1eD6bD35D19B7B0fC1fF57F17f53B589756fce0
const JACK_ADDRESS = "0x75424F0BFBEd93e9103b007F2AB5C3bb6868d9A2"; // Auction: 80% -> uniswap, 20% -> this wallet

const BLOXY_API = "ACCRtzFY9yPTF";
const ETHPLORER_API = "EK-f48kD-FeUA5G1-do7UA";
const ETHERSCAN_API = "KVF2B7VKFFFHEFF2HA1182TIG3I2VA1DBG";
const INFURA_ENDPOINT = `https://polygon-rpc.com/`
const ETHPLORER_TOKEN_HOLDERS_ENDPOINT = `https://api.ethplorer.io/getTopTokenHolders/${AXION_CONTRACT}?apiKey=${ETHPLORER_API}&limit=1000`
const BLOXY_TOKEN_HOLDERS_ENDPOINT = `https://api.bloxy.info/token/token_holders_list?token=${AXION_CONTRACT}&limit=100000&key=${BLOXY_API}&format=structure`
const BLOXY_TOKEN_INFO_ENDPOINT = `https://api.bloxy.info/token/token_stat?token=${AXION_CONTRACT}&key=${BLOXY_API}&format=structure`
const BLOXY_GET_ETH_BALANCE = `https://api.bloxy.info/address/balance?address=${JACK_ADDRESS}&chain=eth&key=${BLOXY_API}&format=structure`
const BLOXY_GET_WEEKLY_AUCTION_BALANCE = `https://api.bloxy.info/address/balance?address=${AUCTION_CONTRACT}&chain=eth&key=${BLOXY_API}&format=structure`
const BLOXY_GET_DAILY_AUCTION_BALANCE = `https://api.bloxy.info/address/balance?address=${STAKING_CONTRACT}&chain=eth&key=${BLOXY_API}&format=structure`
const COINGECKO_TOKEN_INFO_ENDPOINT = "https://api.coingecko.com/api/v3/coins/axion?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";

const ONE_TOKEN_18 = "1000000000000000000";
const web3 = new Web3(INFURA_ENDPOINT);
const PROVIDER = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT);
const USDT = new Token(CHAIN_ID, Web3.utils.toChecksumAddress(USDT_CONTRACT), 6);
const AXION = new Token(CHAIN_ID, Web3.utils.toChecksumAddress(AXION_CONTRACT), 18);
const WETH = new Token(CHAIN_ID, Web3.utils.toChecksumAddress(WETH_CONTRACT), 18);
const DAI = new Token(CHAIN_ID, Web3.utils.toChecksumAddress(DAI_CONTRACT), 18);
const CONTRACTS = {
    token: new web3.eth.Contract(TOKEN_ABI, AXION_CONTRACT),
    bpd: new web3.eth.Contract(BPD_ABI, BPD_CONTRACT),
    staking: new web3.eth.Contract(STAKING_ABI, STAKING_CONTRACT),
}

module.exports = {
    web3,
    USDT,
    DAI,
    WETH,
    AXION,
    PROVIDER,
    CONTRACTS,
    DAI_CONTRACT,
    ONE_TOKEN_18,
    AXION_CONTRACT,
    INFURA_ENDPOINT,
    BLOXY_GET_ETH_BALANCE,
    JACK_ADDRESS_OLD_AMOUNT,
    BLOXY_TOKEN_INFO_ENDPOINT,
    BLOXY_TOKEN_HOLDERS_ENDPOINT,
    COINGECKO_TOKEN_INFO_ENDPOINT,
    BLOXY_GET_DAILY_AUCTION_BALANCE,
    BLOXY_GET_WEEKLY_AUCTION_BALANCE,
    ETHPLORER_TOKEN_HOLDERS_ENDPOINT,
}