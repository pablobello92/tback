
const Users = require('./../models/user');

const getUserCallback = (req, res) => {
    Users.findOne({ username: req.query.username})
    .then(user => {
        res.send(user);
    })
    .catch(err => {
        console.error(err);
    });
}

const updateUserCallback = (req, res) => {
    const user = req.body;
    Users.update(user)
    .then(user => {
        res.send(["model updated!"]);
    })
    .catch(err => {
        res.send(["Error!"]);
    });
}

module.exports = [ getUserCallback, updateUserCallback ]

