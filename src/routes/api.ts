
export {};
const express = require('express');
const router = express.Router();

const [ indexCallback, notFoundCallback ] = require ('./../controllers/index');
const loginCallBack = require('./../controllers/login');
const [ getUserCallback, updateUserCallback ] = require('../controllers/users');
const getCitiesCallback = require('../controllers/cities');
const [ getTracksCallback, sumarizeTracksCallback] = require('./../controllers/tracks');
const [ getReparationsCallback, putReparationCallback ] = require('../controllers/reparations');
const [ predictRoadsCallback, predictAnomaliesCallback ] = require('../controllers/predictions');

router.get('/', indexCallback);
router.get('/api/login', loginCallBack);
router.get('/api/users', getUserCallback );
router.put('/api/users/update', updateUserCallback );
router.get('/api/cities/', getCitiesCallback);
router.get('/api/tracks', getTracksCallback);
router.get('/api/tracks/sumarize', sumarizeTracksCallback);
router.get('/api/reparations', getReparationsCallback);
router.put('/api/reparations/insert', putReparationCallback);

router.get('/api/predictions/anomalies', predictAnomaliesCallback);
router.get('/api/predictions/roadTypes', predictRoadsCallback);

router.get('*', notFoundCallback);

module.exports = router;