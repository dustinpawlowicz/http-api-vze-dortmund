const { db_user, db_host, db_database, db_password, db_port, user_password } = require('./config');
const pg = require('pg');
const userController = require('../controller/user-controller');
const helper = require('../helpers/helper');

const config = {
    user: db_user,
    host: db_host,   
    database: db_database,
    password: db_password,
    port: db_port
};
  
const pool = new pg.Pool(config);

const createTables = async () => {
    try {
        const adminHash = userController.hashPassword(user_password);
        const inspectorHash = userController.hashPassword(user_password);
    
        const createRoleTable = `CREATE TABLE IF NOT EXISTS
            vze_role(
                id SERIAL PRIMARY KEY,
                role_name VARCHAR(20) UNIQUE NOT NULL
            )`;
    
        const createUserTable = `CREATE TABLE IF NOT EXISTS
            vze_user(
                id SERIAL PRIMARY KEY,
                username VARCHAR(30) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deactivated_until TIMESTAMP NULL DEFAULT NULL,
                vze_role_id integer,
                CONSTRAINT fk_role
                    FOREIGN KEY (vze_role_id)
                    REFERENCES vze_role (id)
            )`;
    
        const initRoles = `INSERT INTO vze_role (role_name) VALUES
            ('admin'),
            ('inspector') 
            ON CONFLICT (role_name) DO NOTHING;`;
    
        const initUsers = `INSERT INTO vze_user(username, password, first_name, last_name, vze_role_id) VALUES
            ('admin', '${await adminHash}', 'Dustin', 'Pawlowicz', 
                (SELECT id FROM vze_role WHERE role_name = 'admin')),
            ('inspector', '${await inspectorHash}', 'Dustin', 'Pawlowicz',
                (SELECT id FROM vze_role WHERE role_name = 'inspector'))
            ON CONFLICT (username) DO NOTHING;`;        
               
        await helper.executeQuery(createRoleTable);
        await helper.executeQuery(createUserTable);
        await helper.executeQuery(initRoles);
        await helper.executeQuery(initUsers);
        console.log('\nThe database tables have been created and initialized.');
    } catch(error) {
        console.warn('\nInitial database creation failed:\n ', error);
    } 
}

module.exports = {
    pool,
    createTables  
};