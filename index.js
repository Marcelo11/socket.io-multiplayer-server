var express =  require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.set('port', process.env.PORT || 3000);

var clients = [];
var rooms = [];

io.on("connection", function(socket){
	
	var user;
	var userMove;
	var userTurn;
	var userRun;
	var room;
	var spawnPosition1;
	var spawnPosition2;
	
	socket.on("USER_ROOM_CONNECT", function(data){
		user = data.name;
		var inRoom = false;
		if(rooms.length==0){
			createRoom();
		}
		else {
			console.log("Size rooms "  + rooms.length);
			for (i = 0; i < rooms.length; i++) {
				var roomRange =  parseInt(rooms[i].range);
				var playerRange = parseInt(data.range);
				var range = Math.abs(roomRange - playerRange);

				if(rooms[i].player2=="" && range < 20){
					room = rooms[i];
					rooms[i].player2=data.name;
					inRoom = true;
					
					socket.join(rooms[i].name);
					io.to(rooms[i].name).emit("GO_TO_ARENA",rooms[i]);
					console.log("join room = " + rooms[i].name);
					break;
				}
				
			}
		}
		
		if(!inRoom){
			createRoom();
		}
		
		function createRoom(){
			
			spawnPosition1 = Math.floor((Math.random() * 2));

			if(spawnPosition1 == 0){
				spawnPosition2 = 1;
			}else{
				spawnPosition2 = 0;
			}
			
			
			room={
				name:data.name,
				range:data.range,
				player1:data.name,
				player2:"",
				spawnPlayer1:spawnPosition1,
				spawnPlayer2:spawnPosition2,	
			}
			rooms.push(room);
			inRoom = true;
			
			socket.join(room.name);
			io.to(room.name).emit("USER_ROOM_CONNECTED",room);
			console.log("join new room  = " + room.name);
		}
		
	});
	
	socket.on("USER_ROOM_DISCONNECT", function(){
		socket.disconnect();
	});
	
	socket.on("PLAY", function(data){
		console.log(data);
		currentUser={
			name:data.name,
			position:data.position
		}	
		
		clients.push(currentUser);
		socket.emit("PLAY", currentUser);
		socket.broadcast.emit("USER_CONNECTED", currentUser);
	});

	socket.on("USER_MOVE", function(data){
		//console.log(data);
		userMove={
			playerNumber:data.playerNumber,
			positionX:data.positionX,
			positionY:data.positionY,
			positionZ:data.positionZ,
		}	
		
		io.to(room.name).emit("MOVE",userMove);
	});
	
	socket.on("USER_TURN", function(data){
		console.log(data);
		userTurn={
			playerNumber:data.playerNumber,
			rotationX:data.rotationX,
			rotationY:data.rotationY,
			rotationZ:data.rotationZ,
			rotationW:data.rotationW,
		}	
		
		io.to(room.name).emit("TURN",userTurn);
	});
	
	socket.on("USER_RUN", function(data){
		
		userRun={
			playerNumber:data.playerNumber,
			playerRun:data.playerRun,
		}	
		
		console.log(userRun);
		
		io.to(room.name).emit("RUN",userRun);
	});
	
	
	/*socket.on("MOVE", function(data){
		currentUser.position = data.position;
		socket.emit("MOVE", currentUser);
		socket.broadcast.emit("MOVE", currentUser);
		console.log(currentUser.name + "move to " + current.position);
	});*/
	
	//si un jugador se desconecta estando en una room el otro jugador gana automaticamente
	socket.on("disconnect", function( ){
		

		for (i = 0; i < rooms.length; i++) {
			if(rooms[i].player1 == user){
				deleteRoom(i, {name:rooms[i].player2});
				break;
			}else if (rooms[i].player2 == user){
				deleteRoom(i, {name:rooms[i].player1});
				break;
				
			}
		}
		
		function deleteRoom(numberRoom,winner) {
			
				io.to(room.name).emit("GO_TO_PLAYER_SELECTION",winner);
				rooms.splice(numberRoom, 1);
				socket.leave(room.name);
				console.log("Disconnect from room " + room.name);
				console.log("Disconnect user " + user);
				
	}
		
		
		});
});	

server.listen(app.get('port'), function(){
	console.log("------SERVER IS RUNNING------");
});