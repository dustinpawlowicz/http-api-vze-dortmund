const { port, host } = require('./config/config');
const bodyParser = require('body-parser');
const routes = require('./routes');
const express = require('express');
const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/api', routes);
app.listen(port, host);
console.log(`Server running at http://${host}:${port}/api`);
 
 const db = require('./config/database');
 db.createTables(); 