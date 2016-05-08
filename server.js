var ws = require('nodejs-websocket');

var games = {};

function initGames(){
    games = {};
}

function Game(id, connectionToPlayer1, connectionToPlayer2){
    this.id = id;
    this.connectionToPlayer1 = connectionToPlayer1;
    this.connectionToPlayer2 = connectionToPlayer2;
}

var server = ws.createServer(function(connection){
    console.log('new connection: ');

    var game = {};
    var id = null;

    connection.on('text', function(jsonData){
        var data = JSON.parse(jsonData);
        function gameExists(id){ return games[id] !== undefined; }
        function gameStarted(id){ return games[id].connectionToPlayer2 !== null; }

        console.log(data);

        if(data.request == 'create'){
            //player creates new game with id
            id = data.gameId;

            //the player who creates the game is always player1
            if( !gameExists(id) ){
                connection.player = 'player1';
                connection.otherPlayer = 'player2';
                game = new Game(id, connection, null);
                games[id] = game;
                console.log('game with id '+id+' created');
            }
        }
        else if(data.request == 'join'){
            id = data.gameId;
            //player2 wants to join existing game
            if( gameExists(id) ){
                connection.player = 'player2';
                connection.otherPlayer = 'player1';
                game = games[id];
                game.connectionToPlayer2 = connection;
                console.log('game with id '+id+' joined');
                console.log(games);

                //automatically start game for both players
                game.connectionToPlayer1.sendText(JSON.stringify({
                    response: 'start', player: 'player1', otherPlayer: 'player2'
                }));
                game.connectionToPlayer2.sendText(JSON.stringify({
                    response: 'start', player: 'player2', otherPlayer: 'player1'
                }));
            }
        }
        else if( gameExists(id) && gameStarted(id) ){
            if(data.request == 'move'){
                //just send moves to other player
                if(connection.player == 'player1'){
                    console.log('player1 '+data.move);
                    game.connectionToPlayer2.sendText(JSON.stringify({
                        response: 'move',
                        move: data.move
                    }));
                }
                else if(connection.player == 'player2'){
                    console.log('player2 '+data.move);
                    game.connectionToPlayer1.sendText(JSON.stringify({
                        response: 'move',
                        move: data.move
                    }));
                }
            }
            else if(data.request == 'pause'){
                var response = JSON.stringify({ response: 'pause' });
                game.connectionToPlayer1.sendText(response);
                game.connectionToPlayer2.sendText(response);
            }
            else if(data.request == 'resume'){
                var response = JSON.stringify({ response: 'resume' });
                game.connectionToPlayer1.sendText(response);
                game.connectionToPlayer2.sendText(response);
            }
        }
    });
    connection.on('close', function(){
        console.log('connection closed');
    });
}).listen(8001);