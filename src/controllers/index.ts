export {};
import express from 'express';

export const addHeadersCallback = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Pass to next layer of middleware
    next();
};

export const listenCallback = (): void => {
    console.clear();
    console.log('--------------------------------');
    console.log(`Server running at port ${process.env.PORT}`);
    console.log('--------------------------------');
};

export const indexCallback = (req: express.Request, res: express.Response): void => {
    res.end();
};

export const notFoundCallback = (req: express.Request, res: express.Response): void => {
    res.end(new Error('Route not found'));
};