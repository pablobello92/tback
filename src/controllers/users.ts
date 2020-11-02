export {};
import User from './../models/user';

export const getUserCallback = (req: any, res: any): void => {
    User.findOne({ username: req.query.username})
    .then(user => {
        res.send(user);
    })
    .catch(err => {
        console.error(err);
    });
}

export const updateUserCallback = (req: any, res: any): void => {
    const user = req.body;
    User.update({}, user)
    .then(user => {
        res.send(["model updated!"]);
    })
    .catch(err => {
        res.send(["Error!"]);
    });
}

