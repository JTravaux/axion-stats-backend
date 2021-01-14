const { ethers } = require('ethers');
const { ChainId, Token } = require('@uniswap/sdk');

const Web3 = require('web3');
const TOKEN_ABI = require('./ABIs/token.json');
const BPD_ABI = require('./ABIs/bpd.json');
const STAKING_ABI = require('./ABIs/staking.json');
const AUCTION_ABI = require('./ABIs/auction.json');
const FREECLAIM_ABI = require('./ABIs/foreign_swap.json');
const STAKING_V1_ABI = require('./ABIs/v1/staking.json');

const AXION_CONTRACT = "0x71F85B2E46976bD21302B64329868fd15eb0D127"; 
const BPD_CONTRACT = "0xCF39754913b41946379c130B203Bf8406460D020"; 
const STAKING_CONTRACT = "0x1920d646574E097c2c487F69F40814F95d45bf8C"; 
const STAKING_V1 = "0xCfD53Eff4871B93eD7405F3f428C25F3bf60bbEa";
const AUCTION_CONTRACT = "0xCc9bEC9EE79259C7757a24C288fB5CEAbC9ca40B" 
const FREECLAIM_CONTRACT = "0x12E54c7408Ac4d8885070ED7B379fe615E71C2d1";
const USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";

const JACK_ADDRESS_OLD_AMOUNT = 1255.948057; // 0xC1eD6bD35D19B7B0fC1fF57F17f53B589756fce0
const JACK_ADDRESS = "0x75424F0BFBEd93e9103b007F2AB5C3bb6868d9A2"; // Auction: 80% -> uniswap, 20% -> this wallet

const BLOXY_API = "ACCRtzFY9yPTF";
const ETHPLORER_API = "EK-f48kD-FeUA5G1-do7UA";
const INFURA_API = "92222194d36d44ebadbe57cdd3e30078";
const ETHERSCAN_API = "2AVWB5E47AG32JUNASSZM83A7XE71MQ92R";
const INFURA_ENDPOINT = `https://mainnet.infura.io/v3/${INFURA_API}`
const ETHPLORER_TOKEN_HOLDERS_ENDPOINT = `https://api.ethplorer.io/getTopTokenHolders/${AXION_CONTRACT}?apiKey=${ETHPLORER_API}&limit=1000`
const BLOXY_TOKEN_HOLDERS_ENDPOINT = `https://api.bloxy.info/token/token_holders_list?token=${AXION_CONTRACT}&limit=100000&key=${BLOXY_API}&format=structure`
const BLOXY_TOKEN_INFO_ENDPOINT = `https://api.bloxy.info/token/token_stat?token=${AXION_CONTRACT}&key=${BLOXY_API}&format=structure`
const BLOXY_GET_ETH_BALANCE = `https://api.bloxy.info/address/balance?address=${JACK_ADDRESS}&chain=eth&key=${BLOXY_API}&format=structure`
const BLOXY_GET_WEEKLY_AUCTION_BALANCE = `https://api.bloxy.info/address/balance?address=${AUCTION_CONTRACT}&chain=eth&key=${BLOXY_API}&format=structure`
const BLOXY_GET_DAILY_AUCTION_BALANCE = `https://api.bloxy.info/address/balance?address=${STAKING_CONTRACT}&chain=eth&key=${BLOXY_API}&format=structure`
const COINGECKO_VOLUME_INFO_ENDPOINT = "https://api.coingecko.com/api/v3/coins/axion?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";

const ONE_TOKEN_18 = "1000000000000000000";
const web3 = new Web3(INFURA_ENDPOINT);
const INFURA_PROVIDER = new ethers.providers.InfuraProvider("homestead", INFURA_API)
const PROVIDER = new ethers.providers.EtherscanProvider("homestead", ETHERSCAN_API);
const USDT = new Token(ChainId.MAINNET, Web3.utils.toChecksumAddress(USDT_CONTRACT), 6);
const AXION = new Token(ChainId.MAINNET, Web3.utils.toChecksumAddress(AXION_CONTRACT), 18);
const CONTRACTS = {
    token: new web3.eth.Contract(TOKEN_ABI, AXION_CONTRACT),
    bpd: new web3.eth.Contract(BPD_ABI, BPD_CONTRACT),
    staking: new web3.eth.Contract(STAKING_ABI, STAKING_CONTRACT),
    staking_v1: new web3.eth.Contract(STAKING_V1_ABI, STAKING_V1),
    auction: new web3.eth.Contract(AUCTION_ABI, AUCTION_CONTRACT),
    freeclaim: new web3.eth.Contract(FREECLAIM_ABI, FREECLAIM_CONTRACT),
}

module.exports = {
    web3,
    USDT,
    AXION,
    PROVIDER,
    CONTRACTS,
    ONE_TOKEN_18,
    AXION_CONTRACT,
    INFURA_ENDPOINT,
    BLOXY_GET_ETH_BALANCE,
    JACK_ADDRESS_OLD_AMOUNT,
    BLOXY_TOKEN_INFO_ENDPOINT,
    BLOXY_TOKEN_HOLDERS_ENDPOINT,
    COINGECKO_VOLUME_INFO_ENDPOINT,
    BLOXY_GET_DAILY_AUCTION_BALANCE,
    BLOXY_GET_WEEKLY_AUCTION_BALANCE,
    ETHPLORER_TOKEN_HOLDERS_ENDPOINT,
}