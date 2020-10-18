const Cities = require('./../models/city');

const getCitiesCallback = (req, res) => {
    Cities.find()
    .then(cities => {
        res.send(cities);
    })
    .catch(err => {
        console.error(err);
    });
};

module.exports = getCitiesCallback;