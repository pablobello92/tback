export {};
import express from 'express';
import User from './../models/user';

export const getUserCallback = (req: express.Request, res: express.Response): void => {
    getUser({ username: req.query.username })
        .then((user: any) => {
            res.send(user);
        })
        .catch((error: Error) => {
            res.send(error);
        })
        .finally(() => {
            res.end();
        });
}

export const updateUserCallback = (req: express.Request, res: express.Response): void => {
    updateUser(req.body)
        .then((user: any) => {
            res.send(user);
        })
        .catch((error: Error) => {
            res.send(error);
        })
        .finally(() => {
            res.end();
        });
}

export const getUser = (filter: {}): Promise<Error | any> => {    
    return User.findOne(filter).lean()
        .catch((error: any) => new Error(error));
}

const updateUser = (user: any): Promise<Error | any> => {
    return User.updateOne({}, user)
        .then((result: any) => result)
        .catch((error: any) => new Error(error));
}