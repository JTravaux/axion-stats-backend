const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://JTravaux:9rgQNQPcA6QhETF8@axionstatsdb.4l8x2.mongodb.net/AxionStats?retryWrites=true&w=majority";
const db = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, loggerLevel: 'E' });

const DB_NAME = "AxionStats";
let db_client;

if (!db_client) {
    db.connect(async (err, client) => {
        if (!err)
            db_client = client;
        else
            console.log(err)
    });
}

const getAll = col => db_client.db(DB_NAME).collection(col).find({}).toArray();
const getLatest = col => db_client.db(DB_NAME).collection(col).find().limit(1).sort({ $natural: -1 })
const addOne = (col, doc) => db_client.db(DB_NAME).collection(col).insertOne(doc);
const addMany = (col, data) => db_client.db(DB_NAME).collection(col).insertMany(data);
const drop = col => db_client.db(DB_NAME).collection(col).deleteMany({});

module.exports = {
    db,
    drop,
    getAll,
    addOne,
    addMany,
    getLatest
}