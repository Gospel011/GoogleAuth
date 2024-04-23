const express = require('express');
const app = express();
const morgan = require('morgan');
require('dotenv').config();

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));



module.exports = app;
