export {};
import express from 'express';
const router = express.Router();

import { indexCallback, notFoundCallback } from './../controllers/index';
import { loginCallBack } from './../controllers/login';
import { getUserCallback, updateUserCallback } from '../controllers/users';
import { getCitiesCallback } from '../controllers/cities';
import { getTracksCallback, sumarizeTracksCallback, getSumarizationsCallback, putSumarizationsCallback } from './../controllers/tracks';
import { getReparationsCallback, putReparationCallback } from'../controllers/reparations';
import { predictRoadsCallback, predictAnomaliesCallback } from '../controllers/predictions';

router.get('/', indexCallback);
router.post('/api/login', loginCallBack);
router.get('/api/users', getUserCallback );
router.put('/api/users/update', updateUserCallback );
router.get('/api/cities/', getCitiesCallback);
router.get('/api/tracks', getTracksCallback);
router.get('/api/tracks/sumarize', sumarizeTracksCallback);
router.get('/api/sumarizations/get', getSumarizationsCallback);
router.put('/api/sumarizations/insert', putSumarizationsCallback);
router.get('/api/reparations', getReparationsCallback);
router.put('/api/reparations/insert', putReparationCallback);
router.get('/api/predictions/roadTypes', predictRoadsCallback);
router.get('/api/predictions/anomalies', predictAnomaliesCallback);
router.get('*', notFoundCallback);

export default router;