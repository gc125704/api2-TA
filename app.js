const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

var mongoose = require("mongoose");
require("dotenv").config();

//criar a conexao com o mongodb
const mongoUrl = process.env.MONGO_URL;
mongoose.connect(`${mongoUrl}`) //solicita conexao
.then(() => {console.log("Conectado ao mongodb") }) //deu certo
.catch((err) => {
    console.log("falha ao conectar com o mongodb")
    console.log(err)
 }); //deu errado


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
