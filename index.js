/*jshint esversion: 6 */

const express = require('express');
const app = express();

const morgan = require('morgan');
app.use(morgan('dev'));

// Routes

app.get('/', (req, res) => {
    res.end('Hello World!');
});

app.get('/login', (req, res) => {
    res.end('Login!');
});

app.get('*', (req, res) => {
    res.end('Route not found!');
});

app.listen(3000, () => {
    console.log('server running at port 3000');
});