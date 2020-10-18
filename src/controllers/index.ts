
const indexCallback = (req, res): void => {
    res.end();
};

const notFoundCallback = (req, res): void => {
    res.end('Route not found!');
};

module.exports = [ indexCallback, notFoundCallback ];