'use strict';
const PORT = process.env.PORT || 3000;
// 3rd
const express = require('express');
const app = express();
app.use(express.static('.'));
const server = require('http').Server(app);
const io = require('socket.io')(server);
// 1st
const Player = require('./common').Player;
const Game = require('./common').Game;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

////////////////////////////////////////////////////////////

const localGame = new Game();

io.on('connect', onClientConnect);

function onClientConnect (socket) {
  console.log('player connected');
  socket.on('PING', onClientPing);
  socket.on('disconnect', onClientDisconnect);
  socket.on('HANDSHAKE', onClientHandshake);
  socket.on('KEYDOWN', onClientKeydown);
  socket.on('KEYUP', onClientKeyup);
}

function onClientDisconnect () {
  console.log('client disconnected');
  var player = localGame.removePlayer(this.id);
  this.emit('PLAYER_LEAVE', player);
  this.emit('GAME_STATE', localGame);
}

function onClientHandshake (cb) {
  console.log('client handshake');
  const player = new Player(this.id, 100, 100);
  localGame.addPlayer(player);
  this.emit('PLAYER_JOIN', player);
  this.emit('GAME_STATE', localGame);
  cb(player.id);
}

var KEY_WHITELIST = {
  W: true, A: true, S: true, D: true,
  UP: true, DOWN: true, LEFT: true, RIGHT: true
};

function onClientKeydown (key) {
  if (!KEY_WHITELIST[key]) return;
  localGame.getPlayer(this.id).keys[key] = true;
}

function onClientKeyup (key) {
  if (!KEY_WHITELIST[key]) return;
  localGame.getPlayer(this.id).keys[key] = false;
}

function onClientPing (cb) {
  cb();
}

server.listen(PORT, function () {
  console.log('Listening on', PORT);
});

// LOOPS

localGame.physicsLoop();

// broadcast loop
setInterval(function () {
  // just emit the essential data
  io.emit('GAME_STATE', {
    players: localGame.players,
    bullets: localGame.bullets
  });
}, localGame.broadcastInterval);
