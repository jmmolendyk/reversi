/***********************************/
/* set up the static file server */

/* Include the static file webserver library */
var static = require('node-static');

/* Include the http server library */
var http = require('http');

/* assume we are running on Heroku */
var port = process.env.PORT;
var directory = __dirname + '/public';

/* if we aren't on Heroku, then we need to readjust port and directory information and we know that because port won't be set */
if(typeof port == 'undefined' || !port) {
	directory = './public';
	port = 8080;
}

/* Set up a static web-server that will deliver files from the file system */
var file = new static.Server(directory);

/* Construct http server that gets files from file server */
var app = http.createServer(
	function(request,response){
		request.addListener('end', 
			function(){
				file.serve(request,response);
			}
		).resume();
	}
).listen(port);

console.log('The server is running');

/***********************************/
/* set up the web socket server */


/*  A registry of socket ids and player information   */

var players = [];

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {

	log('Client connection by ' +socket.id);
	

	function log() {
		var array = ['*** server log message: '];
		for(var i = 0; i < arguments.length; i++){
			array.push(arguments[i]);
			console.log(arguments[i]);
		}
		socket.emit('log',array);
		socket.broadcast.emit('log',array);
	}
	

/***********************************/
/* send message */

	socket.on('join_room',function(payload){
		log('\'join_room\' command'+JSON.stringify(payload));

/* check that the client sent a payload  */

		if(('undefined' === typeof payload) || !payload){
			var error_message = 'join_room had no payload, command aborted';
			log(error_message);
			socket.emit('join_room_response',   {
													result: 'fail',
													message: error_message
												});
			return;
		}

/* check that the payload has a room to join */

		var room = payload.room;
		if(('undefined' === typeof room) || !room){
			var error_message = 'join_room didn\'t specify a room, command aborted';
			log(error_message);
			socket.emit('join_room_response',   {
													result: 'fail',
													message: error_message
												});
			return;
		}
		
/* check that a username has been provided  */

		var username = payload.username;
		if(('undefined' === typeof username) || !username){
			var error_message = 'join_room didn\'t specify a username, command aborted';
			log(error_message);
			socket.emit('join_room_response',   {
													result: 'fail',
													message: error_message
												});
			return;
		}
		
/* store information about this new player  */
		players[socket.id] = {};
		players[socket.id].username = username;
		players[socket.id].room = room;


/* actually have the user join the room  */

		socket.join(room);

/* get the room object  */

		var roomObject = io.sockets.adapter.rooms[room];
		
/* tell everyone that is already in the room, that someone just joined  */

		var numClients = roomObject.length;
		var success_data = {
								result: 'success',
								room: room,
								username: username,
								socket_id: socket.id,
								membership: numClients

							};

		io.in(room).emit('join_room_response',success_data);

		for(var socket_in_room in roomObject.sockets){
		
		var success_data = {
								result: 'success',
								room: room,
								username: players[socket_in_room].username,
								socket_id: socket_in_room,
								membership: numClients

							};
			socket.emit('join_room_response',success_data);

		}


		log('join_room success');
});


	socket.on('disconnect',function(){
		log('Client disconnected '+JSON.stringify(players[socket.id]));

		if('undefined' !== typeof players[socket.id] && players[socket.id]){
			var username = players[socket.id].username;
			var room = players[socket.id].room;
			var payload = {
					username: username,
					socket_id: socket.id
							};
			delete players[socket.id];
			io.in(room).emit('player_disconnected',payload);

		}

	});

/***********************************/
/* send message */

	socket.on('send_message',function(payload){
		log('server recognized a command','send_message',payload);
		if(('undefined' === typeof payload) || !payload){
			var error_message = 'send_message had no payload, command aborted';
			log(error_message);
			socket.emit('send_message_response',   {
													result: 'fail',
													message: error_message
												});
			return;
		}
		
		var room = payload.room;
		if(('undefined' === typeof room) || !room){
			var error_message = 'send_message didn\'t specify a room, command aborted';
			log(error_message);
			socket.emit('send_message_response',   {
													result: 'fail',
													message: error_message
												});
			return;
		}
		
		var username = payload.username;
		if(('undefined' === typeof username) || !username){
			var error_message = 'send_message didn\'t specify a username, command aborted';
			log(error_message);
			socket.emit('send_message_response',   {
													result: 'fail',
													message: error_message
												});
			return;
		}

		var message = payload.message;
		if(('undefined' === typeof message) || !message){
			var error_message = 'send_message didn\'t specify a message, command aborted';
			log(error_message);
			socket.emit('send_message_response',   {
													result: 'fail',
													message: error_message
												});
			return;
		}

		var success_data = {
								result: 'success',
								room: room,
								username: username,
								message: message
							};

io.sockets.in(room).emit('send_message_response', success_data);
log('Message sent to room ' + room + ' by ' + username);
});

});










