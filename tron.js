
document.addEventListener('DOMContentLoaded', function() {

    var stepInterval = 300; //in ms

    var game = {player1: {}, player2: {}};

    game.clearMapBeforeNextStep = false;

    game.nextRoundCheck = function() {
        //clearScreen
        if(game.clearMapBeforeNextStep) {
            console.log('next round');
            map.init();
            game.clearMapBeforeNextStep = false;
        }
    };

    function handleKeyEvent(event) {
        if(event.which == 68)        game.player1.setDirection(1, 0); //d
        else if(event.which == 65)   game.player1.setDirection(-1, 0); //a
        else if(event.which == 87)   game.player1.setDirection(0, -1); //w
        else if(event.which == 83)   game.player1.setDirection(0, 1); //s

        if(event.which == 54)        game.player2.setDirection(1, 0); //6
        else if(event.which == 52)   game.player2.setDirection(-1, 0); //4
        else if(event.which == 56)   game.player2.setDirection(0, -1); //8
        else if(event.which == 53)   game.player2.setDirection(0, 1); //5
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
        this.color = color;
        this.name = name;
        this.initialPos = {x: initialPos.x, y: initialPos.y};
        this.pos = initialPos; //field coords
        this.size = field.size; //pixel coords
        this.direction = direction;
        this.score = 0;

        this.step = function(){
            playerStep(this);
        };

        this.scores = function(){
            this.score += 1;
            document.getElementById(this.name+"Score").innerHTML = this.score;
        };

        this.setDirection = function(x, y) {
            this.direction = {x: x, y: y};
        };

        //returns pixel coords of the rect that represents the player
        this.renderedRect = function(){
            return {p1: {x: this.pos.x*field.size.x, y: this.pos.y*field.size.y},
                    p2: {x: this.size.x, y: this.size.y}};
        };

        this.restart = function() {
            this.pos = {x: this.initialPos.x, y: this.initialPos.y};
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
        //init timer

        //map
        map.init();
        timer = setInterval(step, stepInterval);
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