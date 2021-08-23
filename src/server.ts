export {};

import api from './routes'
import express from 'express';
import { 
    json
} from 'body-parser';
import { 
    connect
} from 'mongoose';
import { 
    addHeadersCallback,
    listenCallback 
} from './controllers';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

connect(`${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(json());
app.use(addHeadersCallback);
app.use(api);
app.listen(process.env.PORT, listenCallback);

