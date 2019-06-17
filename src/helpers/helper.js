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
                reject(new SqlQueryError("Error when executing the transferred SQL statement."));
            }
            
            resolve(typeof result === 'undefined' ? {} : result.rows[0]);
        });
    });
}