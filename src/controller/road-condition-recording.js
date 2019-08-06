const helper = require('../helpers/helper');

/**
 *  getCharacteristics - Request all existing characteristics groups containing the corresponding conditions, indicators and magnitudes.
 *
 *  @param request  http.IncomingMessage
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.getCharacteristics = async (request, response) => {
    try {
        const queryString =  `SELECT array_to_json(array_agg(row_to_json(t))) characteristic_groups
            FROM (SELECT g.id, g.key, (SELECT array_to_json(array_agg(row_to_json(t))) condition_characteristics
                FROM (SELECT c.id, c.key, (SELECT array_to_json(array_agg(row_to_json(t))) condition_indicators
                    FROM (SELECT i.id, i.key, (SELECT array_to_json(array_agg(row_to_json(t))) magnitudes
                        FROM (SELECT e.id, e.key, ie.text
                            FROM vze_condition_indicator_magnitude ie
                            INNER JOIN vze_magnitude e ON e.id = ie.magnitude_id
                            WHERE i.id = ie.condition_indicator_id
                            ORDER BY e.id
                        ) t)
                        FROM vze_condition_indicator i
                        WHERE i.condition_characteristic_id = c.id
                        ORDER BY i.id
                    ) t)
                    FROM vze_condition_characteristic c
                    WHERE c.characteristic_group_id = g.id
                    ORDER BY c.id
                ) t)
                FROM vze_characteristic_group g
                ORDER BY g.id
            ) t`;

        const data = await helper.executeQuery(queryString);
        console.log('Characteristics successfully requested.');
        return helper.successResponse(response, 'CHARACTERISTICS_REQUESTED', 'Characteristics request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}

/**
 *  getSigns - Request all existing signs categories containing the corresponding signs.
 *
 *  @param request  http.IncomingMessage
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.getSigns = async (request, response) => {
    try {
        const queryString =  `SELECT array_to_json(array_agg(row_to_json(t))) sign_categories
            FROM (SELECT c.id, c.key, (SELECT array_to_json(array_agg(row_to_json(t))) signs
                FROM (SELECT s.id, s.key, s.name
                    FROM vze_sign s
                    WHERE s.sign_category_id = c.id
                    ORDER BY s.key
                ) t)
                FROM vze_sign_category c
                ORDER BY c.id
            ) t`;

        const data = await helper.executeQuery(queryString);
        console.log('Signs successfully requested.');
        return helper.successResponse(response, 'SIGNS_REQUESTED', 'Signs request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}

/**
 *  getPriorities - Request all existing priorities (basic-data).
 *
 *  @param request  http.IncomingMessage
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.getPriorities = async (request, response) => {
    try {
        const queryString =  `SELECT array_to_json(array_agg(row_to_json(t))) priorities
            FROM (
                SELECT id, key
                FROM vze_priority
            ) t`;

        const data = await helper.executeQuery(queryString);
        console.log('Priorities successfully requested.');
        return helper.successResponse(response, 'PRIORITIES_REQUESTED', 'Priority request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}

/**
 *  getDepartements - Request all existing departements (basic-data).
 *
 *  @param request  http.IncomingMessage
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.getDepartements = async (request, response) => {
    try {
        const queryString =  `SELECT array_to_json(array_agg(row_to_json(t))) departements
            FROM (
                SELECT id, key
                FROM vze_departement
            ) t`;

        const data = await helper.executeQuery(queryString);
        console.log('Departement successfully requested.');
        return helper.successResponse(response, 'DEPARTEMENTS_REQUESTED', 'Departements request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}

/**
 *  getSurfaces - Request all existing surfaces (basic-data).
 *
 *  @param request  http.IncomingMessage
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.getSurfaces = async (request, response) => {
    try {
        const queryString =  `SELECT array_to_json(array_agg(row_to_json(t))) surfaces
            FROM (
                SELECT id, key
                FROM vze_surface
            ) t`;

        const data = await helper.executeQuery(queryString);
        console.log('Surfaces successfully requested.');
        return helper.successResponse(response, 'SURFACES_REQUESTED', 'Surfaces request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}

/**
 *  getComments - Request all existing recording comments (comments).
 *
 *  @param request  http.IncomingMessage
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.getComments = async (request, response) => {
    try {
        const queryString =  `SELECT array_to_json(array_agg(row_to_json(t))) default_comments
            FROM (
                SELECT id, key, text
                FROM vze_comment
            ) t`;

        const data = await helper.executeQuery(queryString);
        console.log('Comments successfully requested.');
        return helper.successResponse(response, 'COMMENTS_REQUESTED', 'Comments request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}