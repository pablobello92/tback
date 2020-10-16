const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const Tracks = require('./../models/track');
const Cities = require('./../models/city');
const Reparations = require('../models/reparation');

const predictRoads = require('./../controllers/predictor');
const sumarizeTracks = require('./../controllers/sumarizer');

// TODO REFACTOR ALL THESE ENDPOINTS

const getTracks = require('../controllers/tracks');
const Reparation = require('../models/reparation');

router.get('/', (req, res) => {
    res.end();
});

router.get('/login/', (req, res) => {
    res.end('Login!');
});

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
        city: req.query.city,
        startTime: {$gte: parseFloat(req.query.from), $lte: parseFloat(req.query.to)}
    };
    console.log(filter);
    Tracks.find(filter).sort([['startTime', -1]]).limit(parseInt(req.query.pages))
    .then(tracks => {
        res.send(tracks);
    })
    .catch(err => {
        console.error(err);
    });
});

router.get('/api/tracks/sumarize', (req, res) => {
    sumarizeTracks()
    .then(result => {
        res.send(result);
    })
});

router.get('/api/cities/', (req, res) => {
    Cities.find()
    .then(cities => {
        res.send(cities);
    })
    .catch(err => {
        console.error(err);
    });
});

router.get('/api/reparations/getReparations', (req, res) => {
    const filter = {
        city: req.query.city
    };
    Reparations.find(filter)
    .then(reparations => {
        res.send(reparations);
    })
    .catch(err => {
        console.error(err);
    });
});

router.put('/api/reparations/', (req, res) => {
    Reparations.insertMany([req.body])
    .then(res => {
        res.send(res)
    })
    .catch(error => {
        res.send(error);
    });
});

router.get('/api/predictions/roadTypes', (req, res) => {
    predictRoads()
    .then(response => {
        res.send(response);
    }, error => {
        console.log('there was an error.');
        res.send(error);
    });
});

router.get('*', (req, res) => {
    res.end('Route not found!');
});

module.exports = router;