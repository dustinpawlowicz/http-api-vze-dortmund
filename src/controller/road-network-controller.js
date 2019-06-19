const { AccessRightsError } = require('../errors/error');
const helper = require('../helpers/helper');
const userController = require('../controller/user-controller');

/**
 *  getNodes - Requests all nodes from the road network
 *             Requirements for a Successful Request: user authenticated
 * 
 *  @param request  http.IncomingMessage - used to get the username and password from the body of the post request
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the necessary node data
 * 
 *  Do not specify which user data is specifically wrong to not disclose information about existing user data
 */
exports.getNodes = async (request, response) => {
    const { username, password } = request.body;    
    try {
        if(!await userController.isAuthenticatedUser(username, password)) {
            throw new IncorrectDataError();
        }

        const queryString = `SELECT array_to_json(array_agg(row_to_json(t))) nodes
            FROM (	
                SELECT id, node_key, ST_AsGeoJSON(ST_Transform(geometry, 4326))::jsonb geometry
                FROM road_network_node
            ) t`;   
        const data = await helper.executeQuery(queryString);

        console.log('Road network nodes request sucessfull.');
        return helper.successResponse(response, 'NODES_REQUESTED', 'Road network nodes successfully requested.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error.key, error.message);
    }
}

/**
 *  getEdges - Requests all edges from the road network
 *             Requirements for a Successful Request: user authenticated
 * 
 *  @param request  http.IncomingMessage - used to get the username and password from the body of the post request
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the necessary edge data
 * 
 *  Do not specify which user data is specifically wrong to not disclose information about existing user data
 */
exports.getEdges = async (request, response) => {
    const { username, password } = request.body;
    try {
        if(!await userController.isAuthenticatedUser(username, password)) {
            throw new IncorrectDataError();
        }

        const queryString = `SELECT array_to_json(array_agg(row_to_json(t))) edges 
            FROM (	
                SELECT id, road_key, road_number, road_name, section_number, from_node_key, to_node_key, road_length,
                    house_number_from_right, house_number_to_right, house_number_from_left, house_number_to_left,
                    ST_AsGeoJSON(ST_Transform(geometry, 4326))::jsonb geometry
                FROM road_network_edge
            ) t`;

        const data = await helper.executeQuery(queryString);

        console.log('Road network edges request sucessfull.');
        return helper.successResponse(response, 'EDGES_REQUESTED', 'Road network edges successfully requested.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error.key, error.message);
    }
}