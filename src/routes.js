const express = require('express');
const routes = express.Router();
const userController = require('./controller/user-controller');
const roadNetworkController = require('./controller/road-network-controller');
const roadConditionRecording = require('./controller/road-condition-recording');

routes.get('/', (request, response) => {
    return response.send('This is the VZE Dortmund RESTful API, running with Node.js, Express, and Postgres!')
});

routes.post('/login', userController.login);
routes.post('/register', userController.register);
routes.post('/change-password', userController.changePassword);
routes.post('/edit-user', userController.edit);
routes.post('/delete-user', userController.delete);
routes.get('/roles', userController.getRoles);
routes.post('/users', userController.getUsers);

routes.post('/nodes', roadNetworkController.getNodes);
routes.post('/edges', roadNetworkController.getEdges);

routes.get('/characteristics', roadConditionRecording.getCharacteristics);
routes.get('/signs', roadConditionRecording.getSigns);
routes.get('/priorities', roadConditionRecording.getPriorities);
routes.get('/departements', roadConditionRecording.getDepartements);
routes.get('/surfaces', roadConditionRecording.getSurfaces);
routes.get('/comments', roadConditionRecording.getComments);

module.exports = routes;