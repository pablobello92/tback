/*jshint esversion: 6 */

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const api = require('./routes/api');

// Setup de la app
const app = express();

// Conexión a la BBDD
mongoose.connect('mongodb://localhost:27017/db_tesis');

// Middleware: handler de requests HTTP
app.use(morgan('dev'));

// body-parser para requests HTTP
app.use(bodyParser.json());

// Add headers
app.use(function (req, res, next) {

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
});

// API
app.use(api);

app.listen(3000, () => {
    console.log('server running at port 3000');
});