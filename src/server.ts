export {};

import api from './routes/api'
import express from 'express';
import { json } from 'body-parser';
import { connect } from 'mongoose';
import { addHeadersCallback, listenCallback } from './controllers';
connect('mongodb://localhost:27017/db_tesis', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(api, json(), addHeadersCallback);
app.listen(8000, listenCallback);

