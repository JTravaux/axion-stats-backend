const fs = require("fs");

const calculateEcosystemLevels = data => {
    let unique_addresses = [];
    const results = {
        totals: {
            holders: 0,
            held_axn: 0,
            last_updated: Date.now(),
        },
        shrimp: {
            count: 0,
            totalAxn: 0,
        },
        crab: {
            count: 0,
            totalAxn: 0,
        },
        fish: {
            count: 0,
            totalAxn: 0,
        },
        octopus: {
            count: 0,
            totalAxn: 0,
        },
        dolphin: {
            count: 0,
            totalAxn: 0,
        },
        tigerShark: {
            count: 0,
            totalAxn: 0,
        },
        greatWhite: {
            count: 0,
            totalAxn: 0,
        },
        whale: {
            count: 0,
            totalAxn: 0,
        }
    }

    data.forEach(r => {
        const ADDRESS = r.address.toUpperCase();
        const BALANCE = Math.round(r.balance);

        if (!unique_addresses.includes(ADDRESS) && BALANCE >= 1)
            unique_addresses.push(ADDRESS)

        if (BALANCE >= 1 && BALANCE <= 999) {
            results["shrimp"].count++;
            results.totals.held_axn += BALANCE;
            results["shrimp"].totalAxn += BALANCE;            
        }
        else if (BALANCE >= 1000 && BALANCE <= 999999) {            
            results["crab"].count++;
            results.totals.held_axn += BALANCE;
            results["crab"].totalAxn += BALANCE;
        }
        else if (BALANCE >= 1000000 && BALANCE <= 9999999) {            
            results["fish"].count++;
            results.totals.held_axn += BALANCE;
            results["fish"].totalAxn += BALANCE;
        }
        else if (BALANCE >= 10000000 && BALANCE <= 49999999) {            
            results["octopus"].count++;
            results.totals.held_axn += BALANCE;
            results["octopus"].totalAxn += BALANCE;
        }
        else if (BALANCE >= 50000000 && BALANCE <= 99999999) {            
            results["dolphin"].count++;
            results.totals.held_axn += BALANCE;
            results["dolphin"].totalAxn += BALANCE;
        }
        else if (BALANCE >= 100000000 && BALANCE <= 499999999) {            
            results["tigerShark"].count++;
            results.totals.held_axn += BALANCE;
            results["tigerShark"].totalAxn += BALANCE;
        }
        else if (BALANCE >= 500000000 && BALANCE <= 999999999) {            
            results["greatWhite"].count++;
            results.totals.held_axn += BALANCE;
            results["greatWhite"].totalAxn += BALANCE;
        }
        else if (BALANCE >= 1000000000) {
            results["whale"].count++;
            results.totals.held_axn += BALANCE;
            results["whale"].totalAxn += BALANCE;
        }
    })

    results.totals.holders = unique_addresses.length;
    return results;
}

const splitInteger = (number, parts) => {
    const remainder = number % parts
    const baseValue = (number - remainder) / parts

    return Array(parts).fill(baseValue).fill(baseValue + 1, parts - remainder)
}

const uniqueify = a => [...new Set(a.map(o => JSON.stringify(o)))].map(s => JSON.parse(s))

const saveToFile = (fileName, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, JSON.stringify(data), (err) => {
            if (err) 
                reject(err);
            else resolve();
        });
    })
}

const readFile = fileName => {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, "utf-8", (err, data) => {
            if (err) 
                return reject(err)
            else 
                return resolve(JSON.parse(data))
        });
    })
}

module.exports = {
    readFile,
    uniqueify,
    saveToFile,
    splitInteger,
    calculateEcosystemLevels,
}