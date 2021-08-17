export {};

import {
    getUserByFilter
} from './users';

export const loginCallBack = (req: any, res: any): void => {
    const filter: any = {
        username: req.body.username,
        password: req.body.password
    };
    getUserByFilter(filter)
        .then((user: any) => {
            res.send(user);
        })
        .catch((error: Error) => {
            res.send(error);
        })
        .finally(() => {
            res.end();
        });
};