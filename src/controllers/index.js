
const indexCallback = (req, res) => {
    res.end();
};

const notFoundCallback = (req, res) => {
    res.end('Route not found!');
};

module.exports = [ indexCallback, notFoundCallback ];