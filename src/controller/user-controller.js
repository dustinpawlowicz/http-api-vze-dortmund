const { IncompleteDataError, IncorrectDataError, AccessRightsError } = require('../errors/error');
const bcrypt = require('bcrypt');
const helper = require('../helpers/helper');

/**
 *  loginUser - Requesting a user with the user data required on the client.
 *              Requirements for a Successful Request: user existing, user activated, password matches
 * 
 *  @param request  http.IncomingMessage - used to get the username and password from the body of the post request
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the necessary user data
 * 
 *  Do not specify which user data is specifically wrong to not disclose information about existing user data
 */
exports.login = async (request, response) => {
    const { username, password } = request.body;
   
    try {
        if(!(username && password)) {
            throw new IncompleteDataError('Username and password required.');
        }

        if(!await isUserExisting(username)) {
            throw new IncorrectDataError();
        }

        const queryString = `SELECT u.username, u.password, u.first_name, u.last_name, r.role_name
                FROM vze_user u
                INNER JOIN vze_role r ON r.id = u.vze_role_id
                WHERE u.username='${username}'`;
    
        const isActivated = isUserActivated(username);
        const data = await helper.executeQuery(queryString);
        
        if(!await isActivated || !await comparePassword(password, data['password'])) {
            throw new IncorrectDataError();
        }

        delete data['password'];
        console.log('Login request sucessfull:\n ', data);
        return successResponse(response, 'USER_REQUESTED', 'User request successful.', data);
    } catch(error) {
        console.warn(error);
        return errorResponse(response, error.key, error.message);
    }
}

/**
 *  registerUser - Requesting a user with the user data required on the client. Restricted access, which can only be performed by an admin.
 *                 Requirements for a Successful Request: request by an admin, user is not existing, password is hashed
 * 
 *  @param request  http.IncomingMessage - used to get the username and password from the body of the post request
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.register = async function (request, response) {
    const { username, password, firstName, lastName, roleName, adminUsername, adminPassword } = request.body;

    try {
        if(!(username && password && firstName && lastName && roleName && adminUsername && adminPassword)) {
            throw new IncompleteDataError('Registration data incomplete.');
        }
        
        const isAdminAccess = isAdmin(adminUsername, adminPassword);
        const isExisting = isUserExisting(username);
        const hash = hashPassword(password);

        if(!await isAdminAccess) {
            throw new AccessRightsError();
        }

        if(await isExisting) {
            throw new IncorrectDataError('The username already exists.');
        }

        const  queryString = `INSERT INTO vze_user(username, password, first_name, last_name, vze_role_id)
            VALUES('${username}', '${await hash}', '${firstName}', '${lastName}',
                (SELECT id FROM vze_role WHERE role_name = '${roleName}'))`;
        await helper.executeQuery(queryString);
            
        console.log('New user added. Username: %s, Role: %s', username, roleName);
        return successResponse(response, 'USER_CREATED', 'The user was successfully created.');
    } catch(error) {
        console.warn(error);
        return errorResponse(response, error.key, error.message);
    }
}

/**
 *  changePassword - Request to change the password of a user
 *                   Requirements for a Successful Request: user is existing, newPassword is hashed
 * 
 *  @param request  http.IncomingMessage - used to get the username, password and newPassword from the body of the post request
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 * 
 *  Do not specify which user data is specifically wrong to not disclose information about existing user data
 */
exports.changePassword = async (request, response) => {
    const { username, password, newPassword } = request.body;

    try {
        if(!(username && password && newPassword)) {
            throw new IncompleteDataError('Change password data is incomplete.');
        }

        if(!await isUserExisting(username)) {
            throw new IncorrectDataError();
        }
        
        const data = helper.executeQuery(`SELECT password FROM vze_user WHERE username= '${username}'`);
        const hash = hashPassword(newPassword);

        if(!await comparePassword(password, (await data).password)) {
            throw new IncorrectDataError();
        }

        const queryString =  `UPDATE vze_user SET password = '${(await hash)}' WHERE username = '${username}'`;   
        await helper.executeQuery(queryString);
  
        console.log('User password successfully changed. Username: %s', username);
        return successResponse(response, 'USER_EDITED', 'The user password has been successfully changed.');
    } catch(error) {
        console.warn(error);
        return errorResponse(response, error.key, error.message);
    }
}

/**
 *  edit - Request to edit the user data
 *         Requirements for a Successful Request: request by an admin, user is existing, password is hashed when to change
 * 
 *  @param request  http.IncomingMessage - used to get the username, password, firstName, lastName, roleName, deactivatedUntil,
 *                  adminUsername and adminPassword from the body of the post request
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.edit = async (request, response) => {
    const { username, password, firstName, lastName, roleName, deactivatedUntil, adminUsername, adminPassword } = request.body;

    try {
        if(!((password || firstName || lastName || roleName || deactivatedUntil) && username && adminUsername && adminPassword)) {
            throw new IncompleteDataError('Change user data is incomplete.');
        }

        const isAdminAccess = isAdmin(adminUsername, adminPassword);
        const isExisting = isUserExisting(username);
        const hash = password ? hashPassword(password) : null;

        if(!await isAdminAccess) {
            throw new AccessRightsError();
        }

        if(!await isExisting) {
            throw new IncorrectDataError();
        }

        let queryString = `UPDATE vze_user SET` +
            (password ? ` password = '${await hash}',` : ``) +
            (firstName ? ` first_name = '${firstName}',` : ``) +
            (lastName ? ` last_name = '${lastName}',` : ``) +
            (roleName ? ` vze_role_id = (SELECT id FROM vze_role WHERE role_name = '${roleName}'),` : ``) +
            (deactivatedUntil && (new Date(deactivatedUntil)).getTime() > 0 ? ` deactivated_until = '${deactivatedUntil}' ` : ``);
            
        queryString = queryString.substring(0, queryString.length - 1); // Remove unneeded separator from last entry.
        queryString += ` WHERE username = '${username}'`;    
        console.log(queryString);      
        await helper.executeQuery(queryString);

        console.log('User successfully edited. Username: %s', username);
        return successResponse(response, 'USER_EDITED', 'The user has been successfully edited.');
    } catch(error) {
        console.warn(error);
        return errorResponse(response, error.key, error.message);
    }
}

/**
 *  delete - Request to delete a user
 *           Requirements for a Successful Request: request by an admin, user is existing
 * 
 *  @param request  http.IncomingMessage - used to get the username, adminUsername and adminPassword from the body of the post request
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.delete = async (request, response) => {
    const { username, adminUsername, adminPassword } = request.body;

    try {
        if(!(username && adminUsername && adminPassword)) {
            throw new IncompleteDataError('Change user data is incomplete.');
        }

        const [isAdminAccess, isExisting] = await Promise.all([
            isAdmin(adminUsername, adminPassword),
            isUserExisting(username)
        ]);
        if(!isAdminAccess) {
            throw new AccessRightsError();
        }

        if(!isExisting) {
            throw new IncorrectDataError();
        }

        const queryString =  `DELETE FROM vze_user WHERE username = '${username}'`;
        await helper.executeQuery(queryString);
            
        console.log('User successfully deleted. Username: %s', username);
        return successResponse(response, 'USER_DELETED', 'The user was successfully deleted.');

    } catch(error) {
        console.warn(error);
        return errorResponse(response, error.key, error.message);
    }
}


/**
 *  isUserExisting - User Existence Check.
 * 
 *  @param username the user name of the user to be checked
 *  @return         a promise to be either resolved with the existence check result or rejected with an error
 */
function isUserExisting(username) {
    return new Promise((resolve, reject) => {
        if(!username) {
            reject(new IncompleteDataError('The username is required to check if the user exists.'));
        }

        const queryString = `SELECT COUNT(username) 
            FROM vze_user 
            WHERE username='${username}'`;

        helper.executeQuery(queryString).then((data) => {
            let isUserExisting = (data['count'] > 0);
            console.log('User \'%s\' exists: ', username, isUserExisting);

            resolve(isUserExisting);
        }).catch((error) => {
            reject(error);
        });
    });
}

/**
 *  isUserActivated - Check whether the user is activated.
 * 
 *  @param username the user name of the user to be checked
 *  @return         a promise to be either resolved with the activated check result or rejected with an error
 */
function isUserActivated(username) {
    return new Promise((resolve, reject) => {
        if(!username) {
            reject(new IncompleteDataError('The username is required to check if the user is activated.'));
        }

        const queryString = `SELECT deactivated_until 
            FROM vze_user 
            WHERE username='${username}'`;

        helper.executeQuery(queryString).then((data) => {
            let isActivated = !(data['deactivated_until'] != null && new Date(data['deactivated_until']) > new Date());      
            console.log('User \'%s\' activated: ', username, isActivated);
            
            resolve(isActivated);
        }).catch((error) => {
            reject(error);
        });
    });
}

/**
 * isAdmin - Check if the user has admin rights
 * 
 * @param username the user name of the admin to be checked
 * @param password the user password of the admin to be checked
 */
function isAdmin(username, password) {
    return new Promise(async (resolve, reject) => {
        if(!(username && password)) {
            reject(new IncompleteDataError('The username is required to check if the user has the role of an admin.'));
        }

        if(!await isUserExisting(username)) {
            reject(new IncorrectDataError());
        }

        const queryString = `SELECT u.password, r.role_name 
            FROM vze_user u
            INNER JOIN vze_role r ON r.id = u.vze_role_id
            WHERE u.username='${username}'`;

        Promise.all([
            isUserActivated(username),
            helper.executeQuery(queryString)
        ])
        .then(async ([isActivated, data]) => {
            if(!isActivated || !await comparePassword(password, data['password'])) {
                throw new IncorrectDataError();
            }

            isAdminAccess = ('admin' === data['role_name']);
            console.log('Admin access granted: ', isAdminAccess);
            resolve(isAdminAccess)   
        }).catch((error) => {
            reject(error);
        });
    });
}

/**
 * hashPassword - bcrypt libary to generate a random salt and a hash to securely store the password in the database.
 *                To generate the salt the recommended salt rounds cost factor of 10 is used.
 * @see https://www.npmjs.com/package/bcrypt
 * 
 * @param password  the password which should be hashed
 * @return          a promise to be either resolved with the hashed password or rejected with an error
 */
function hashPassword(password) {
    return new Promise(async (resolve, reject) => {
        if(!password) {
            reject(new IncompleteDataError('Submit a password to perform the hash operation.'));
        }
        
        try {
            const salt =  await bcrypt.genSalt(10);
            const hash =  await bcrypt.hash(password, salt);
        
            resolve(hash);
        } catch (error) {
            reject(new ModuleOperationError('Failed to hash the password.'));
        }
    });
}
exports.hashPassword = hashPassword;

/**
 * comparePassword - the bcrypt libary is used to compare the plaintext password entered by the user with the hashed password from the database.
 * @see https://www.npmjs.com/package/bcrypt
 * 
 * @param userPassword      hashed password which is stored in the database
 * @param enteredPassword   plaintext password entered by the user which is to be compared with the {@code userPassword} from the database
 * @returns                 a callback which indicates whether the passwords match
 */
function comparePassword(plaintextPassword, hashedPassword) {
    return new Promise(async (resolve, reject) => {
        if(!(plaintextPassword && hashedPassword)) {
            reject(new IncompleteDataError('Send password and hash for comparison.'));
        }

        bcrypt.compare(plaintextPassword, hashedPassword).then((isMatch) => {
            console.log('Entered passwords match: ', isMatch);
            resolve(isMatch);
        }).catch((error) => {
            reject(new ModuleOperationError('Password comparison failed.'));
        });
    });
}

/**
 *  errorResponse - Creates a error response to the client in the form of a JSON object, which can contain a status and message.
 *
 *  @param response http.ServerResponse - used to send the error message to the client in the form of a JSON object
 *  @param key      key that specifies the error
 *  @param message  specific error message for the response
 *  @return         http.ServerResponse that transmits a JSON object
 */
function errorResponse(response, key, message) {
    return response.status(400).json({
        'status': 'error',
        'key' : key ? key : 'UNKNOWN',
        'msg': message ? message : 'Unknown error.'
    });
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
function successResponse(response, key, message, data) {
    let jsonObj = {
        'status': 'success',
        'key' : key ? key : 'UNKNOWN',
        'msg': message ? message : 'Request successful.'
    };

    if(data) {
        jsonObj['data'] = data;
    }

    return response.status(200).json(jsonObj);
}