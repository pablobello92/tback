
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.end('Hello World!');
});

router.get('/login', (req, res) => {
    res.end('Login!');
});

router.get('*', (req, res) => {
    res.end('Route not found!');
});

module.exports = router;

