const http = require('http');
const express = require('express');
const colyseus = require('colyseus');
const monitor = require("@colyseus/monitor").monitor;
const path = require('path');
//const socialRoutes = require("@colyseus/social/express").default;

const outdoor = require('./room/public').outdoor;

const port = Number(process.env.PORT || 2567);
const app = express()

const server = http.createServer(app);
const gameServer = new colyseus.Server({ server });

// register your room handlers
gameServer.register('outdoor', outdoor);

/* register @colyseus/social routes
app.use("/", socialRoutes);*/

app.use("/", express.static(path.join(__dirname, "./../client/public")));

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor(gameServer));

gameServer.listen(port);
console.log(`Listening on ws://localhost:${ port }`)
