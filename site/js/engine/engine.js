if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    var requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.oRequestAnimationFrame      ||
                window.msRequestAnimationFrame     ||
                function(/* function */ callback, /* DOMElement */ element){
                  window.setTimeout(callback, 1000 / 60);
                };
    })();

    exports.Engine = function(showStats) {
        this.showStats = showStats;
        this.entity_manager = new engine.EntityManager();
        this.systems = [];
    };

    exports.Engine.prototype.addSystem = function(system) {
        this.systems.push(system);
    };

    exports.Engine.prototype.endGame = function() {
        console.log("End Game(engine)");
        if (this.endGameCallback) {
            this.endGameCallback();
            this.endGameCallback = undefined;
        }
    };

    exports.Engine.prototype.loadMap = function(data) {
        var self = this;
        var splitString = function(string) {
            var codes = [];
            for (var i=0; i<string.length/2; i++) {
                codes.push(string[i*2] + string[i*2+1]);
            }
            return codes;
        }

        _.each(data.map, function(row, y) {
            _.each(row, function(cell, x) {
                var tile = _.cloneDeep(data.tiles[cell[0]]);
                var entity = self.entity_manager.newEntity();
                //var rotation = cell[1] % 4;
                //var flip = Math.floor(cell[1] / 4);
                //if (flip > 1) {
                //    rotation = Math.random(0, 3);
                //    flip = Math.random(0, 1);
                //}
                self.entity_manager.setComponent(entity, "position", {x: x, y: y});
                self.entity_manager.setComponents(entity, tile);

                if (tile && tile.spawn) {
                    _.each(tile.spawn, function(spawn) {
                        var entity = self.entity_manager.newEntity();
                        self.entity_manager.setComponent(entity, "position", {x: x, y: y});
                        self.entity_manager.setComponents(entity, _.clone(spawn));
                    });
                }
            });
        });

        _.each(data.entities, function(data) {
            var entity = self.entity_manager.newEntity();
            self.entity_manager.setComponents(entity, data);
        });
    };

    exports.Engine.prototype.addPlayer = function() {
        var spawn = this.entity_manager.getEntitiesWithComponents(["spawn"]);

        var position = _.first(_.shuffle(spawn)).position;
        position = {
            "x": position.x,
            "y": position.y
        }

        var reticle = this.entity_manager.newEntity();
        var player = this.entity_manager.newEntity();

        this.entity_manager.setComponent(reticle, "angle", 0);
        this.entity_manager.setComponent(reticle, "position", {x: 0, y: 0});
        this.entity_manager.setComponent(reticle, "graphics", {
            "type": "sprite",
            "parent": player,
            "sheet": "/img/reticle.png",
            "width": 0.2,
            "height": 0.2,
            "sheet_width": 1,
            "sheet_length": 1,
            "sheet_idx": 0,
            "level": 0.1
        });

        this.entity_manager.setComponent(player, "position", position);
        this.entity_manager.setComponent(player, "angle", 0);
        this.entity_manager.setComponent(player, "scripts", {
            init: "player_init",
            think: "player_think"
        });

        this.entity_manager.setComponent(player, "player", {
            angle: 0,
            reticle_distance: 1,
            reticle: reticle
        });
        this.entity_manager.setComponent(player, "graphics", {
            "type": "sprite",
            "sheet": "/img/player.png",
            "sheet_width": 2,
            "sheet_length": 2,
            "sheet_idx": 0,
            "level": 0.1
        });
        this.entity_manager.setComponent(player, "physics", {
            type: 2,
            linearDamping: 8,
            restitution: 0.5,
            shapes: [{
                type: "circle",
                radius: 0.3,
            }]
        });
    };

    exports.Engine.prototype.gameLoop = function(endGameCallback) {
        var self = this;
        var stats;
        self.endGameCallback = endGameCallback;
        _.each(this.systems, function(system) {
            system.init(self);
        });

        if (this.showStats) {
            var stats = new Stats();
            stats.setMode(0); // 0: fps, 1: ms

            // Align top-left
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.left = '0px';
            stats.domElement.style.top = '0px';
            document.body.appendChild( stats.domElement );
        }

        var oldTime = Date.now();
        var update = function() {
            var newTime = Date.now();
            var dt = (newTime - oldTime) / 1000;
            oldTime = newTime;
            if (stats) { stats.begin(); }

            _.each(self.systems, function(system) {
                system.think(dt);
            });
            requestAnimFrame(update);
            if (stats) { stats.end(); }
        }

        requestAnimFrame(update);
    }
})(typeof exports === 'undefined'? this['engine']={}: exports);
