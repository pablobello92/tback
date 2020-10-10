const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const Tracks = require('./../models/track');
const Cities = require('./../models/city');

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

/**
 * GET 10 Tracks by user_name
 * TODO add city filter
 * TODO add pagination
 */
router.get('/api/tracks/getTracksByUserName', (req, res) => {
    const filter = {
        username: req.query.username,
        city: req.query.city,
    };
    Tracks.find(filter).limit(10)
    .then(tracks => {
        res.send(getTracks(tracks));
    })
    .catch(err => {
        console.error(err);
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

// TODO: UPDATE User


router.get('*', (req, res) => {
    res.end('Route not found!');
});

module.exports = router;