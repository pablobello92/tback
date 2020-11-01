export {};

import api from './routes'
import express from 'express';
import { json } from 'body-parser';
import { connect } from 'mongoose';
import { addHeadersCallback, listenCallback } from './controllers';

connect('mongodb://localhost:27017/db_tesis', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(json());
app.use(addHeadersCallback);
app.use(api);
app.listen(8000, listenCallback);

