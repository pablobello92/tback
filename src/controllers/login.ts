export {};

const loginCallBack = (req, res) => {
    console.log(req.body);
    res.send({
        user: 'pablo_bello',
        nickname: 'Pablo Bello'
    });
};

export { loginCallBack };