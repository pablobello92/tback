export {};

const addHeadersCallback = (req, res, next): void => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
};

const listenCallback = (): void => {
    console.log('--------------------------------');
    console.log(`Server running at port 8000`);
    console.log('--------------------------------');
};

const indexCallback = (req, res): void => {
    res.end();
};

const notFoundCallback = (req, res): void => {
    res.end('Route not found!');
};

export { addHeadersCallback, listenCallback, indexCallback, notFoundCallback };