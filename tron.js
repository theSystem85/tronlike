
document.addEventListener('DOMContentLoaded', function() {

    var stepInterval = 300; //in ms

    var game = {player1: {}, player2: {}};

    game.clearMapBeforeNextStep = false;

    game.connection = {};

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

    game.nextRoundCheck = function() {
        //clearScreen
        if(game.clearMapBeforeNextStep) {
            console.log('next round');
            map.init();
            game.clearMapBeforeNextStep = false;
        }
    };

    function handleKeyEvent(event) {
        
        /*switchIt(''+event.which, {
            '68': game.player1.right, //d
            '65': game.player1.left, //a
            '87': game.player1.up, //w
            '83': game.player1.down, //s
        });*/

        switchIt(''+event.which, {
            '68': wrap(game.connection.send, 'right', game.connection), //d
            '65': wrap(game.connection.send, 'left', game.connection), //a
            '87': wrap(game.connection.send, 'up', game.connection), //w
            '83': wrap(game.connection.send, 'down', game.connection), //s

            '54': game.player2.right, //6
            '52': game.player2.left, //4
            '56': game.player2.up, //8
            '53': game.player2.down, //5
        });

        console.log("keydown: "+event.which);
    }
    document.addEventListener("keydown", handleKeyEvent);

    var field = {
        size: {x: 10, y: 10}
    }

    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    var timer;

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

        //init timer
        timer = setInterval(step, stepInterval);

        //init server websocket connection
        game.connection = new WebSocket('ws://localhost:8001');
        game.connection.onmessage = function(event){
            var msg = event.data;

            switchIt(msg, {
                'up': game.player1.up,
                'down': game.player1.down,
                'left': game.player1.left,
                'right': game.player1.right
            });
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