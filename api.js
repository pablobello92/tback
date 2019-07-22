const express = require('express');
const router = express.Router();

router.get('/api/test', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    return res.end('{"hola": "que tal"}');
});

module.exports = router;