export {};

export const loginCallBack = (req: any, res: any) => {
    console.log(req.body);
    res.send({
        user: 'pablo_bello',
        nickname: 'Pablo Bello'
    });
};