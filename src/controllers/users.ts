export {};
import {
    Document
} from 'mongoose';
import User from './../models/user';

export const getUserCallback = (req: any, res: any): void => {
    getUserByFilter({
            username: req.query.username
        })
        .then(user => {
            res.send(user);
        })
        .catch(err => {
            console.error(err);
        });
}

export const getUserByFilter = async (filter: {}) => {
    try {
        const user: Document = await User.findOne(filter);
        if (!user) {
            return null;
        }
        return user;
    } catch (error) {
        throw new Error(error);
    }
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