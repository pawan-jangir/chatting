var http    = require('http');
var express = require('express'),
    app = module.exports.app = express();

var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(3000); 


// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames connected to the chat
var usernames = {};

// rooms available currently in chat
var rooms = ['btech','mtech','phd'];

io.sockets.on('connection', function (socket) {


	socket.on('adduser', function(username){
		socket.username = username;
		socket.room = 'btech';
		usernames[username] = username;
		socket.join('btech');
		socket.emit('updatechat', 'SERVER', 'you have connected to btech');
		socket.broadcast.to('btech').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'btech');
	});

    // send new chat
	socket.on('sendchat', function (data) {
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });
    
	// when the client emits 'createNewRoom', this listens and executes
	socket.on('createNewRoom', function (data) {
        rooms.push(data);
        let currentRoom = socket.room;
        socket.leave(currentRoom);
		socket.join(data);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ data);
		socket.broadcast.to(currentRoom).emit('updatechat', 'SERVER', socket.username+' has left this room');
		socket.room = data;
		socket.broadcast.to(data).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, data);
    });
    
    // switch room
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});

	// on disconnect
	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
