const express = require('express');
const app = express();
const morgan = require('morgan');
require('dotenv').config();

app.use(morgan('dev'));



module.exports = app;
