const express = require('express');
const routes = express.Router();
const userController = require('./controller/user-controller');
const roadNetworkController = require('./controller/road-network-controller');

routes.get('/', (request, response) => {
    return response.send('This is the VZE Dortmund RESTful API, running with Node.js, Express, and Postgres!')
});

routes.post('/login', userController.login);
routes.post('/register', userController.register);
routes.post('/changePassword', userController.changePassword);
routes.post('/editUser', userController.edit);
routes.post('/deleteUser', userController.delete);

routes.post('/nodes', roadNetworkController.getNodes);
routes.post('/edges', roadNetworkController.getEdges);
module.exports = routes;