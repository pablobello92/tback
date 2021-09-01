export {};
import express from 'express';
const api = express.Router();

import { indexCallback, notFoundCallback } from '../controllers/index';
import { loginCallBack } from '../controllers/login';
import { getUserCallback, updateUserCallback } from '../controllers/users';
import { getCitiesCallback } from '../controllers/cities';
import { getTracksCallback } from '../controllers/tracks';
import { getSumarizationsCallback, executeSumarizationCallback } from '../controllers/sumarizations';
import { getReparationsCallback, putReparationCallback } from'../controllers/reparations';
import { executePredictionsCallback } from '../controllers/predictions';

api.get('/', indexCallback);
api.post('/api/login', loginCallBack);
api.get('/api/users', getUserCallback );
api.put('/api/users/update', updateUserCallback );
api.get('/api/cities', getCitiesCallback);
api.get('/api/tracks', getTracksCallback);
api.get('/api/sumarizations/get', getSumarizationsCallback);
api.post('/api/sumarizations', executeSumarizationCallback);
api.get('/api/reparations', getReparationsCallback);
api.put('/api/reparations/insert', putReparationCallback);
api.post('/api/predictions', executePredictionsCallback);
api.get('*', notFoundCallback);

export default api;