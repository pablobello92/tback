export {};
import User from './../models/user';

export const getUserCallback = (req: any, res: any): void => {
    getUserByFilter({ username: req.query.username })
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

export const updateUserCallback = (req: any, res: any): void => {
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

export const getUserByFilter = (filter: {}): Promise<Error | any> => {
    return User.findOne(filter).lean()
        .catch((error: any) => new Error(error));
}

const updateUser = (user: any): Promise<Error | any> => {
    return User.updateOne({}, user)
        .then((result: any) => result)
        .catch((error: any) => new Error(error));
}