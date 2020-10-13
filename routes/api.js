const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const Tracks = require('./../models/track');
const Cities = require('./../models/city');

const predictRoads = require('./../controllers/predictor');


/**
 * TODO refactor in controllers!
 */

const getTracks = require('../controllers/tracks');

router.get('/', (req, res) => {
    res.end();
});

router.get('/login/', (req, res) => {
    res.end('Login!');
});

// GET User
router.get('/api/users/', (req, res) => {
    User.findOne({ username: req.query.username})
    .then( user => {
        res.send(user);
    })
    .catch( err => {
        console.error(err);
    });
});

router.get('/api/tracks/getUserTracks', (req, res) => {
    const filter = {
        username: req.query.username,
        city: req.query.city
    };
    Tracks.find(filter).sort([['startTime', -1]]).limit(parseInt(req.query.pages))
    .then(tracks => {
        res.send(tracks);
    })
    .catch(err => {
        console.error(err);
    });
});

router.get('/api/tracks/sumarize', (req, res) => {
    const filter = {
        username: 'pablo_bello',
        city: 'Tandil'
    };
    Tracks.find(filter).sort([['startTime', -1]]).limit(2)
    .then(tracks => {
        debugger
    })
});


router.get('/api/predictions/roadTypes', (req, res) => {
    predictRoads()
    .then(response => {
        res.send(response);
    });
});





router.get('/api/cities/', (req, res) => {
    Cities.find()
    .then(cities => {
        console.log(cities);
        res.send(cities);
    })
    .catch(err => {
        console.error(err);
    });
});

router.get('*', (req, res) => {
    res.end('Route not found!');
});

module.exports = router;