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
            _.each(splitString(row), function(cell, x) {
                var tile = data.tiles[cell];
                var entity = self.entity_manager.newEntity();
                self.entity_manager.setComponent(entity, "position", {x: x, y: y});
                self.entity_manager.setComponents(entity, tile);
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
            "type": "shape",
            "parent": player,
            "shape": {
                "type": "circle",
                "radius": 0.05
            },
            "level": 0.1
        });

        this.entity_manager.setComponent(reticle, "physics", {
            type: 1,
            shape: {
                type: "circle",
                radius: 0.1,
            }
        });

        this.entity_manager.setComponent(player, "position", position);
        this.entity_manager.setComponent(player, "angle", 0);
        this.entity_manager.setComponent(player, "scripts", {
            init: "player_init",
            think: "player_think"
        });

        this.entity_manager.setComponent(player, "player", {
            angle: 0,
            reticle_distance: 5,
            reticle: reticle
        });
        this.entity_manager.setComponent(player, "graphics", {
            "type": "sprite",
            "sheet": "/images/mob/robots.png",
            "sheet_width": 17,
            "sheet_height": 16,
            "sheet_idx": 37,
            "level": 0.1
        });
        this.entity_manager.setComponent(player, "physics", {
            type: 2,
            linearDamping: 8,
            restitution: 0.5,
            shape: {
                type: "circle",
                radius: 0.3,
            }
        });
    };

    exports.Engine.prototype.gameLoop = function() {
        var self = this;
        var stats;
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
