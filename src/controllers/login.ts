export {};

import User from '../models/user';
import { getUserByFilter } from './users';

export const loginCallBack = (req: any, res: any) => {
    const filter = {
        username: req.body.username,
        password: req.body.password
    };
    getUserByFilter(filter)
    .then(user => {
        res.send(user);
    })
    .catch(error => {
        console.error(error);
        res.send(error);
    })
};