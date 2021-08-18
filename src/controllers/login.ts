export {};
import express from 'express';
import {
    getUser
} from './users';

export const loginCallBack = (req: express.Request, res: express.Response): void => {
    const filter: any = {
        username: req.body.username,
        password: req.body.password
    };
    getUser(filter)
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