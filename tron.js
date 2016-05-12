//deployment test3
document.addEventListener('DOMContentLoaded', function() {

    var stepInterval = 300; //in ms

    var game = {player1: {}, player2: {}};

    game.clearMapBeforeNextStep = false;

    game.connection = {};

    var field = {
        size: {x: 10, y: 10}
    }

    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    var timer;
    var paused = true;

    //utility function for neat switch case constructs where case is a function call without args
    function switchIt(key, map){
        map[key]();
    }

    function wrap(func, value, context){
        if(typeof(context) !== undefined){
            return function(){
                func.call(context, value);
            };
        }
        else {
            return function(){
                func(value);
            };
        }
    }

    game.join = function(){
        var id = document.getElementById('input-game-id').value;
        var request = JSON.stringify({request: 'join', gameId: id});
        game.connection.send(request);
    }

    game.create = function(){
        var id = document.getElementById('input-game-id').value;
        var request = JSON.stringify({request: 'create', gameId: id});
        game.connection.send(request);
    }

    game.pause = function(){
        paused = true;
        clearInterval(timer);
        document.getElementById('status').innerHTML = 'game paused!';
        document.getElementById('btn-pause').innerHTML = 'resume';
    }

    game.resume = function(){
        paused = false;
        timer = setInterval(step, stepInterval);
        document.getElementById('status').innerHTML = 'game resumed!';
        document.getElementById('btn-pause').innerHTML = 'pause';
    }

    //send msg to server to pause the game for both players
    game.requestPause = function(){
        game.connection.send(JSON.stringify({request: 'pause'}));
    }

    //send msg to server to resume the game for both players
    game.requestResume = function(){
        game.connection.send(JSON.stringify({request: 'resume'}));
    }

    game.pauseOrResume = function(){
        paused ? game.requestResume() : game.requestPause();
    }

    game.nextRoundCheck = function() {
        //clearScreen
        if(game.clearMapBeforeNextStep) {
            console.log('next round');
            map.init();
            game.clearMapBeforeNextStep = false;
        }
    };

    function getMoveRequest(move){
        return JSON.stringify({request: 'move', move: move});
    }

    function upPressed(){
        game.connection.send(getMoveRequest('up'));
        game[game.player].up();
    }

    function downPressed(){
        game.connection.send(getMoveRequest('down'));
        game[game.player].down();
    }

    function rightPressed(){
        game.connection.send(getMoveRequest('right'));
        game[game.player].right();
    }

    function leftPressed(){
        game.connection.send(getMoveRequest('left'));
        game[game.player].left();
    }

    function handleKeyEvent(event) {

        switchIt(''+event.which, {
            '68': rightPressed, //d
            '65': leftPressed, //a
            '87': upPressed, //w
            '83': downPressed, //s

            /*'54': game.player2.right, //6
            '52': game.player2.left, //4
            '56': game.player2.up, //8
            '53': game.player2.down, //5*/
        });
    }

    document.getElementById('btn-join').addEventListener("click", game.join);
    document.getElementById('btn-create').addEventListener("click", game.create);
    document.getElementById('btn-pause').addEventListener("click", game.pauseOrResume);
    document.getElementById('btn-pause').setAttribute('disabled', 'disabled');
    document.addEventListener("keydown", handleKeyEvent);
    document.getElementById('input-game-id').addEventListener('keydown', function(event){
        event.stopPropagation();
    });

    function Map(size){
        //size in fields
        this.size = size;
        this.color = "#FFFFFF";

        var color = this.color;
        this.init = function(){
            this.fields = [];
            for(x = 0; x < size.x; x++){
                var rowBuf = [];
                for(y = 0; y < size.y; y++){
                    rowBuf.push(color);
                }
                this.fields.push(rowBuf);
            }
        };
    }

    function Player(name, initialPos, direction, color){
        var player = this;
        player.color = color;
        player.name = name;
        player.initialPos = {x: initialPos.x, y: initialPos.y};
        player.pos = initialPos; //field coords
        player.size = field.size; //pixel coords
        player.direction = direction;
        player.score = 0;

        player.step = function(){
            playerStep(player);
        };

        player.scores = function(){
            player.score += 1;
            document.getElementById(player.name+"Score").innerHTML = player.score;
        };

        player.setDirection = function(x, y) {
            player.direction = {x: x, y: y};
        };

        player.up    = function(){player.setDirection(0, -1);};
        player.down  = function(){player.setDirection(0, 1);};
        player.left  = function(){player.setDirection(-1, 0);};
        player.right = function(){player.setDirection(1, 0);};

        //returns pixel coords of the rect that represents the player
        player.renderedRect = function(){
            return {p1: {x: player.pos.x*field.size.x, y: player.pos.y*field.size.y},
                    p2: {x: player.size.x, y: player.size.y}};
        };

        player.restart = function() {
            player.pos = {x: player.initialPos.x, y: player.initialPos.y};
        };
    }

    function playersOnSamePosition(p1, p2) {
        return (p1.pos.x == p2.pos.x) && (p1.pos.y == p2.pos.y);
    }

    //init objects
    game.player1 = new Player("player1", {x: 10, y: 25}, {x: 1, y: 0}, "#FF0000");
    game.player2 = new Player("player2", {x: 40, y: 25}, {x: -1, y: 0}, "#00FF00");
    var map = new Map({x: 50, y: 50});

    function playerStep(player){
        player.pos.x += player.direction.x;
        player.pos.y += player.direction.y;

        if(!(player.pos.x < map.size.x)) {
            player.pos.x = 0;
        }
        else if(player.pos.x < 0) {
            player.pos.x = map.size.x-1;
        }

        if(!(player.pos.y < map.size.y)) {
            player.pos.y = 0;
        }
        else if(player.pos.y < 0) {
            player.pos.y = map.size.y-1;
        }

        collisionCheck();

        map.fields[player.pos.x][player.pos.y] = player.color;

        function collisionCheck() {
            if(map.fields[player.pos.x][player.pos.y] !== map.color) {
                //the player is hitting a wall
                var otherPlayerName = player.name == "player1" ? "player2" : "player1";
                game[otherPlayerName].scores();
                game.clearMapBeforeNextStep = true;

                //if both players hit the same field in the same step both get a point!
                if( playersOnSamePosition(player, game[otherPlayerName]) ) {
                    player.scores();
                }
            }
        }
    }

    function initGame() {

        //map
        map.init();

        //init server websocket connection
        game.connection = new WebSocket('ws://patrick-beyer-software.de:8001');
        game.connection.onmessage = function(event){
            var data = JSON.parse(event.data);

            console.log(data);

            if(data.response == 'move'){
                switchIt(data.move, {
                    'up': game[game.otherPlayer].up,
                    'down': game[game.otherPlayer].down,
                    'left': game[game.otherPlayer].left,
                    'right': game[game.otherPlayer].right
                });
            }
            else if(data.response == 'start'){
                //init timer
                paused = false;
                game.otherPlayer = data.otherPlayer;
                game.player = data.player;
                timer = setInterval(step, stepInterval);
                document.getElementById('status').innerHTML = 'game started!';
                document.getElementById('btn-pause').removeAttribute('disabled');
            }
            else if(data.response == 'pause'){
                game.pause();
            }
            else if(data.response == 'resume'){
                game.resume();
            }
            else if(data.response == 'status'){
                document.getElementById('status').innerHTML = data.status;
            }
        }
    }

    function step() {
        //*********game logic
        //move players
        game.player1.step();
        game.player2.step();
        game.nextRoundCheck();

        //draw stuff
        render();
    }

    function render() {
        //clear all drawings from the last render step
        ctx.fillStyle = map.color;
        ctx.fillRect(0, 0, map.size.x*field.size.x, map.size.y*field.size.y);

        //render map
        map.fields.forEach(function(column, x){
            column.forEach(function(_field, y){
                //todo
                ctx.fillStyle = _field;
                ctx.fillRect(x*field.size.x, y*field.size.y, x*(field.size.x+1), y*(field.size.y+1));
            });
        });

        //render players
        var player1Rect = game.player1.renderedRect();
        ctx.fillStyle = game.player1.color;
        ctx.fillRect(player1Rect.p1.x, player1Rect.p1.y, player1Rect.p2.x, player1Rect.p2.y);

        var player2Rect = game.player2.renderedRect();
        ctx.fillStyle = game.player2.color;
        ctx.fillRect(player2Rect.p1.x, player2Rect.p1.y, player2Rect.p2.x, player2Rect.p2.y);
    }
    initGame();
}, false);