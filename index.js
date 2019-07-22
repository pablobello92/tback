/*jshint esversion: 6 */

const express = require('express');
const morgan = require('morgan');
const routes = require('./routes');
const api = require('./api');

const app = express();

// Middleware: handler de requests HTTP
app.use(morgan('dev'));

// API
app.use(api);

// Routing
app.use(routes);

app.listen(3000, () => {
    console.log('server running at port 3000');
});