const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 5000,
    host: process.env.HOST,
    db_user: process.env.DB_USER,
    db_host: process.env.DB_HOST,
    db_database: process.env.DB_NAME,
    db_password: process.env.DB_PASSWORD,
    db_port: process.env.DB_PORT,
    user_password: process.env.USER_PASSWORD
}