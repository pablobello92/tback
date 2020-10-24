export {};
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const routes = require('./routes/api');

const listenCallback = (): void => {
    console.log('--------------------------------');
    console.log(`Server running at port 8000`);
    console.log('--------------------------------');
};

const addHeadersCallback = (req, res, next): void => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
};

mongoose.connect('mongodb://localhost:27017/db_tesis', { useNewUrlParser: true, useUnifiedTopology: true });
const app = express();
app.use(bodyParser.json());
/* app.use(bodyParser.json({limit: '200mb'}));
app.use(bodyParser.urlencoded({limit: '200mb', extended: true})); */
app.use(addHeadersCallback);
app.use(routes);
app.listen(8000, listenCallback);

