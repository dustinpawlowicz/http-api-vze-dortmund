const { SqlQueryError } = require('../errors/error');
const {pool} = require('../config/database');

/**
 * executeQuery - Access to PostgreSQL database by executing SQL statements
 * 
 * @param queryString   the SQl statement to be executed
 * @return              a promise to be either resolved with the query result or rejected with an error
 */
exports.executeQuery = (queryString) => {
    return new Promise((resolve, reject) => {
        if(!queryString) {
            reject(new SqlQueryError('SQL statement cannot be executed due to missing query.'));
        }

        pool.query(queryString, (error, result) => {
            if(error) {
                reject(new SqlQueryError("Error when executing the transferred SQL statement. " + error));
            }
            
            resolve(typeof result === 'undefined' ? {} : result.rows[0]);
        });
    });
}

/**
 *  errorResponse - Creates a error response to the client in the form of a JSON object, which can contain a status and message.
 *
 *  @param response http.ServerResponse - used to send the error message to the client in the form of a JSON object
 *  @param error    the error to be handled
 *  @return         http.ServerResponse that transmits a JSON object
 */
exports.errorResponse = (response, error) => {
    let jsonObj = {
        'status': 'error',
        'key' : error.key ? error.key : 'UNKNOWN',
        'msg': error.message ? error.message : 'Unknown error.',
        'data': error.data ? error.data : {}
    };

    return response.status(400).json(jsonObj);
}

/**
 *  successResponse - Creates a sucess response to the client in the form of a JSON object, which can contain a status, a message, as well as a data set.
 *
 *  @param response http.ServerResponse - used to send the success message to the client in the form of a JSON object
 *  @param key      key that specifies the type of the successful request
 *  @param message  specific success message for the response
 *  @param data     encludes optional data to attach to the response e.g. a user
 *  @return         http.ServerResponse that transmits a JSON object
 */
exports.successResponse = (response, key, message, data) => {
    let jsonObj = {
        'status': 'success',
        'key' : key ? key : 'UNKNOWN',
        'msg': message ? message : 'Request successful.',
        'data': data ? data : {}
    };

    return response.status(200).json(jsonObj);
}