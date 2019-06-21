const { port, host } = require('./config/config');
const bodyParser = require('body-parser');
const routes = require('./routes');
const express = require('express');
var cors = require('cors');
const app = express();

// Enable all CORS requests for testing purposes
app.use(cors());

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse application/json
app.use(bodyParser.json());

app.use('/api', routes);
app.listen(port, host);
console.log(`Server running at http://${host}:${port}/api`);
 
 const db = require('./config/database');
 db.createTables(); 