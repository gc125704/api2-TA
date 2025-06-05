const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require("mongoose");
const { ApolloServer } = require('apollo-server-express');
require("dotenv").config();

// Importar schema e resolvers do GraphQL
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

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
var ndviMapsRouter = require('./routes/ndviMaps');

var app = express();

// Configuração de CORS para permitir requisições de diferentes origens
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
    })
});

// Iniciar o Apollo Server
async function startApolloServer() {
    await server.start();
    server.applyMiddleware({ app });
}

startApolloServer();

// Rotas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/ndvi-maps', ndviMapsRouter);

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Erro interno do servidor',
            status: err.status || 500
        }
    });
});

module.exports = app;