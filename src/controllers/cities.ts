export {};

import City from './../models/city';

export const getCitiesCallback = (req: any, res: any): void => {
    fetchCityFields()
    .then((result: any[]) => {
        res.send(result);
    })
    .catch((error: Error) => {
        res.send(error);
    })
    .finally(() => {
        res.end();
    });
};

// TODO: Refactor the entire Backend: add this catch(Error()) to every Mongoose execution
// TODO: test this approach!
export const fetchCityFields = (fields?: string): Promise<Error | any[]> => {
    return City.find().lean().select(fields).exec()
    .catch((error: any) => new Error(error));
}