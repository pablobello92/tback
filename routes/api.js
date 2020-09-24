const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const Tracks = require('./../models/track');

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

// GET Tracks
/**
 * If I simply "FETCH ONE TRACK" then this one should be "the best"? or the one that matches some criteria...
 */
router.get('/api/tracks', (req, res) => {
    Tracks.findOne({ username: req.query.username})
    .then( tracks => {
        res.send(tracks);
    })
    .catch( err => {
        console.error(err);
    });
});

// GET ALL Tracks
// Eso de merge lo puedo hacer con un map dentro de un pipe en el front!
/**
 * CURRENTLY IS FETCHING ONLY 10 TRACKS... IT SHOULD FETCH ALL
 */
router.get('/api/tracks/getTracksByUserName', (req, res) => {
    Tracks.find({ username: req.query.username}).limit(2)
    .then( tracks => {
        res.send(getTracks(tracks));
    })
    .catch( err => {
        console.error(err);
    });
});

// TODO: UPDATE User


router.get('*', (req, res) => {
    res.end('Route not found!');
});

module.exports = router;