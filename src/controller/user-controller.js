const { IncompleteDataError, IncorrectDataError, AccessRightsError, UserDeactivatedError } = require('../errors/error');
const bcrypt = require('bcrypt');
const helper = require('../helpers/helper');

/**
 *  loginUser - Requesting a user with the user data required on the client.
 *              Requirements for a Successful Request: user is authenticated
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
        if(!await isAuthenticatedUser(username, password)) {
            throw new IncorrectDataError();
        }

        const queryString = `SELECT u.id, u.username, u.first_name, u.last_name, r.role_name
                FROM vze_user u
                INNER JOIN vze_role r ON r.id = u.vze_role_id
                WHERE u.username='${username}'`;

        const data = await helper.executeQuery(queryString);
        console.log('Login request sucessfull:\n ', data);
        return helper.successResponse(response, 'USER_REQUESTED', 'User request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
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
        console.log(username, password, firstName, lastName, roleName, adminUsername, adminPassword)
        const isAdminAccess = isAuthenticatedAdmin(adminUsername, adminPassword);
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
            
        console.log('New user \'%s\' with the role of an \'%s\' added.', username, roleName);
        return helper.successResponse(response, 'USER_CREATED', 'The user was successfully created.');
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
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
        if(password === newPassword) {
            throw new IncorrectDataError('Choose a different password.');
        }

        if(!await isAuthenticatedUser(username, password)) {
            throw new IncorrectDataError();
        }

        const hash = hashPassword(newPassword);
        const queryString =  `UPDATE vze_user SET password = '${(await hash)}' WHERE username = '${username}'`;   
        await helper.executeQuery(queryString);
  
        console.log('User password successfully changed. Username: %s', username);
        return helper.successResponse(response, 'PASSWORD_CHANGED', 'The user password has been successfully changed.');
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
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
        if(!((password || firstName || lastName || roleName || deactivatedUntil != null) && username && adminUsername && adminPassword)) {
            throw new IncompleteDataError('Change user data is incomplete.');
        }

        const isAdminAccess = isAuthenticatedAdmin(adminUsername, adminPassword);
        const isExisting = isUserExisting(username);
        const hash = password ? hashPassword(password) : null;

        if(!await isAdminAccess) {
            throw new AccessRightsError();
        }

        if(!await isExisting) {
            throw new IncorrectDataError();
        }

        let isDateValid = false;
        if(deactivatedUntil != null) {
            const date = new Date(deactivatedUntil);
            isDateValid = date instanceof Date && !isNaN(date);
        }

        let queryString = `UPDATE vze_user SET` +
            (password ? ` password = '${await hash}',` : ``) +
            (firstName ? ` first_name = '${firstName}',` : ``) +
            (lastName ? ` last_name = '${lastName}',` : ``) +
            (roleName ? ` vze_role_id = (SELECT id FROM vze_role WHERE role_name = '${roleName}'),` : ``) +
            (deactivatedUntil != null ? (` deactivated_until = ` + (isDateValid ? `'${deactivatedUntil}'` : 'NULL') + ` `) : ``);

        queryString = queryString.substring(0, queryString.length - 1); // Remove unneeded separator from last entry.
        queryString += ` WHERE username = '${username}'`;
        await helper.executeQuery(queryString);

        console.log('User successfully edited. Username: %s', username);
        return helper.successResponse(response, 'USER_EDITED', 'The user has been successfully edited.');
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
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

        const isAdminAccess = isAuthenticatedAdmin(adminUsername, adminPassword);
        const isExisting = isUserExisting(username);

        if(!await isAdminAccess) {
            throw new AccessRightsError();
        }

        if(!await isExisting) {
            throw new IncorrectDataError();
        }

        const queryString =  `DELETE FROM vze_user WHERE username = '${username}'`;
        await helper.executeQuery(queryString);
            
        console.log('User successfully deleted. Username: %s', username);
        return helper.successResponse(response, 'USER_DELETED', 'The user was successfully deleted.');
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}

/**
 * isAuthenticatedUser - Checks if the user can authenticate himself and is activated.
 * 
 * @param username  the user name of the user to be checked
 * @param password  the user password of the user to be checked
 * @return          a promise to be either resolved with the authentication check result or rejected with an error
 * 
 * Do not specify which user data is specifically wrong to not disclose information about existing user data
 */
function isAuthenticatedUser(username, password) {
    return new Promise(async (resolve, reject) => {
        try {
            if(!(username && password)) {
                throw new IncompleteDataError('Username and password required.');
            }
    
            if(!await isUserExisting(username)) {
                throw new IncorrectDataError();
            }
    
            const isDeactivated = isUserDeactivated(username);
            const queryString = `SELECT password FROM vze_user WHERE username='${username}'`;
            const data = await helper.executeQuery(queryString);

            if(await isDeactivated) {
                throw new UserDeactivatedError(null, await isDeactivated);
            }

            const isAuthenticated = !await isDeactivated && await isPasswordMatch(password, data['password']);
            console.log('User \'%s\' is authenticated: ', username, isAuthenticated);
            resolve(isAuthenticated);
        } catch(error) {
            reject(error);
        }
    });
}
exports.isAuthenticatedUser = isAuthenticatedUser;

/**
 *  getRoles - Request all existing roles
 *
 *  @param request  http.IncomingMessage
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.getRoles = async (request, response) => {
    try {
        const queryString =  `SELECT array_to_json(array_agg(row_to_json(t))) roles
            FROM (
                SELECT *
                FROM vze_role
            ) t`;

        const data = await helper.executeQuery(queryString);
        console.log('Roles successfully requested.');
        return helper.successResponse(response, 'ROLES_REQUESTED', 'Roles request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}

/**
 *  getUsers - Request all existing users
 *
 *  @param request  http.IncomingMessage
 *  @param response http.ServerResponse - used to send data back to the client
 *  @return         http.ServerResponse with a json object containing the result information
 */
exports.getUsers = async (request, response) => {
    const { adminUsername, adminPassword } = request.body;

    try {
        if(!(adminUsername && adminPassword)) {
            throw new IncompleteDataError('Incomplete data to fetch users.');
        }
        console.log(adminUsername, adminPassword)
        const isAdminAccess = isAuthenticatedAdmin(adminUsername, adminPassword);

        if(!await isAdminAccess) {
            throw new AccessRightsError();
        }

        const queryString =  `SELECT array_to_json(array_agg(row_to_json(t))) users
            FROM (
                SELECT u.id, u.username, u.first_name, u.last_name, r.role_name, u.deactivated_until
                FROM vze_user u
                INNER JOIN vze_role r ON r.id = u.vze_role_id
            ) t`;
            console.log(queryString);
        const data = await helper.executeQuery(queryString);
        console.log('Users successfully requested.');
        return helper.successResponse(response, 'USERS_REQUESTED', 'Users request successful.', data);
    } catch(error) {
        console.warn(error);
        return helper.errorResponse(response, error);
    }
}

/**
 * isAuthenticatedAdmin - Check if the user is authenticated and has admin rights
 * 
 * @param username the user name of the admin to be checked
 * @param password the user password of the admin to be checked
 */
function isAuthenticatedAdmin(username, password) {
    return new Promise(async (resolve, reject) => {
        try {
            if(!await isAuthenticatedUser(username, password)) {
                throw new IncorrectDataError();
            }

            const queryString = `SELECT r.role_name 
                FROM vze_user u
                INNER JOIN vze_role r ON r.id = u.vze_role_id
                WHERE u.username='${username}'`;

            const data = await helper.executeQuery(queryString);
            isAdminAccess = ('admin' === data['role_name']);
            console.log('Admin access granted for user \'%s\': ', username, isAdminAccess);
            resolve(isAdminAccess)  
        } catch(error) {
            reject(error);
        }
    });
}

/**
 *  isUserExisting - User Existence Check.
 * 
 *  @param username the user name of the user to be checked
 *  @return         a promise to be either resolved with the existence check result or rejected with an error
 */
function isUserExisting(username) {
    return new Promise(async (resolve, reject) => {
        try {
            if(!username) {
                throw new IncompleteDataError('The username is required to check if the user exists.');
            }

            const queryString = `SELECT COUNT(username) 
                FROM vze_user 
                WHERE username='${username}'`;

            const data =  await helper.executeQuery(queryString);
            let isUserExisting = (data['count'] > 0);

            console.log('User \'%s\' exists: ', username, isUserExisting);         
            resolve(isUserExisting);
        } catch(error) {
            reject(error);
        };
    });
}

/**
 *  isUserDeactivated - Check whether the user is deactivated.
 * 
 *  @param username the user name of the user to be checked
 *  @return         a promise to be either resolved with the deactivated check result or rejected with an error
 */
function isUserDeactivated(username) {
    return new Promise(async (resolve, reject) => {
        try {
            if(!username) {
                throw new IncompleteDataError('The username is required to check if the user is activated.');
            }

            const queryString = `SELECT deactivated_until 
                FROM vze_user 
                WHERE username='${username}'`;

            const data =  await helper.executeQuery(queryString);

            let isDeactivated = null;
            if(data['deactivated_until'] != null) {
                const date = new Date(data['deactivated_until']);
                isDeactivated = (date instanceof Date && !isNaN(date) && date.getTime() > new Date().getTime()) ? data['deactivated_until'] : null;
            }

            console.log('User \'%s\' deactivated until \'%s\.', username, isDeactivated); 
            resolve(isDeactivated);
        } catch(error) {
            reject(error);
        };
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
 * isPasswordMatch - the bcrypt libary is used to compare the plaintext password entered by the user with the hashed password from the database.
 * @see https://www.npmjs.com/package/bcrypt
 * 
 * @param userPassword      hashed password which is stored in the database
 * @param enteredPassword   plaintext password entered by the user which is to be compared with the {@code userPassword} from the database
 * @returns                 a callback which indicates whether the passwords match
 */
function isPasswordMatch(plaintextPassword, hashedPassword) {
    return new Promise(async (resolve, reject) => {
        if(!(plaintextPassword && hashedPassword)) {
            reject(new IncompleteDataError('Send password and hash for comparison.'));
        }

        try {
            const isMatch =  await bcrypt.compare(plaintextPassword, hashedPassword);
            console.log('Entered passwords match: ', isMatch);
            resolve(isMatch);
        } catch (error) {
            reject(new ModuleOperationError('Password comparison failed.'));
        }
    });
}