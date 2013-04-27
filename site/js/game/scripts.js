if (typeof game === "undefined") { game = {}; }

(function(exports) {
    var Keyboard = (function() {
        var pressed = {};
        return {
            isDown: function(key) {
                return pressed[key];
            },
            keyDown: function(e) {
                if (e.which === 70) {
                    var havePointerLock = document["pointerLockElement"] ||
                                          document["webkitPointerLockElement"] ||
                                          document["mozillaPointerLockElement"];
                    if (havePointerLock) {
                        element = $('body')[0];
                        element.requestFullScreen = element.requestFullScreen ||
                                                    element.webkitRequestFullScreen ||
                                                    element.mozRequestFullScreen ||
                                                    element.msRequestFullScreen;
                        element.requestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                        element.requestPointerLock = element.requestPointerLock ||
                                                     element.mozRequestPointerLock ||
                                                     element.webkitRequestPointerLock;
                        element.requestPointerLock();
                    }
                }
                pressed[e.which] = true;
            },
            keyUp: function(e) {
                delete pressed[e.which];
            }
        };
    }());

    var Mouse = (function() {
        var mouseX = 0;
        var mouseY = 0;
        return {
            mouseMove: function(e) {
                var havePointerLock = document["pointerLockElement"] ||
                                      document["webkitPointerLockElement"] ||
                                      document["mozillaPointerLockElement"];

                if (havePointerLock) {
                    var mxKey = 'movementX' in e ? 'movementX' : undefined ||
                                'webkitMovementX' in e ? 'webkitMovementX' : undefined ||
                                'mozillaMovementX' in e ? 'mozillaMovementX' : undefined;
                    var myKey = 'movementY' in e ? 'movementY' : undefined ||
                                'webkitMovementY' in e ? 'webkitMovementY' : undefined ||
                                'mozillaMovementY' in e ? 'mozillaMovementY' : undefined;
                    var movementX = e[mxKey];
                    var movementY = e[myKey];

                    if (movementX !== undefined &&
                        movementY !== undefined) {
                        mouseX += movementX;
                        mouseY += movementY;
                    } else {
                        console.log("Mouse Error");
                        console.log(movementX);
                        console.log(movementY);
                        console.log(e);
                    }
                }
            },
            mouseDown: function(e) {
            },
            mouseX: function() {
                return mouseX;
            },
            mouseY: function() {
                return mouseY;
            }
        }
    }());

    $(function() {
        document.addEventListener('keydown',    Keyboard.keyDown);
        document.addEventListener('keyup',      Keyboard.keyUp);
        document.addEventListener('mousemove',  Mouse.mouseMove);
        $('body').click(function() {
            var element = this;
            element.requestPointerLock = element.requestPointerLock ||
                                         element.mozRequestPointerLock ||
                                         element.webkitRequestPointerLock;
            element.requestPointerLock();

        });
    });

    var walk = 10;
    var run = 20;

    exports.scripts = {
        player_init: function(engine) {
            var self = this;
            document.addEventListener('mousedown',  function(e) {
                var reticle = engine.entity_manager.getComponentsForEntity(self.player.reticle);
                var node = engine.entity_manager.newEntity();
                engine.entity_manager.setComponent(node, "angle", 0);
                engine.entity_manager.setComponent(node, "position", {
                    x: reticle.position.x,
                    y: reticle.position.y
                });
                engine.entity_manager.setComponent(node, "graphics", {
                    "type": "shape",
                    "shape": {
                        "type": "circle",
                        "radius": 0.05
                    },
                    "level": 0.1
                });
            });

            var reticle = engine.entity_manager.newEntity();

            engine.entity_manager.setComponent(reticle, "position", {
                x: this.position.x - this.player.reticle_distance*Math.sin(this.player.angle),
                y: this.position.y - this.player.reticle_distance*Math.cos(this.player.angle)
            });
            engine.entity_manager.setComponent(reticle, "angle", -this.player.angle);
            engine.entity_manager.setComponent(reticle, "graphics", {
                "type": "sprite",
                "parent": this.entity,
                "sheet": "/img/reticle.png",
                "width": 0.2,
                "height": 0.2,
                "sheet_width": 1,
                "sheet_length": 1,
                "sheet_idx": 0,
                "level": 0.1
            });

            this.player.reticle = reticle;
        },
        player_think: function(engine, dt) {
            this.physics.force = {x: 0, y: 0};
            var move = 0;
            var strafe = 0;
            var force = walk;
            if (Keyboard.isDown(32))
                force = run;
            if (Keyboard.isDown(65))
                strafe = -1;
            if (Keyboard.isDown(87))
                move = -1;
            if (Keyboard.isDown(68))
                strafe = 1;
            if (Keyboard.isDown(83))
                move = 1;
            this.character.angle = -Mouse.mouseX() / 360;
            this.player.reticle_distance = Math.max(0, Math.min(5, -Mouse.mouseY() / 200));

            var x = move * Math.sin(this.character.angle) + strafe * Math.cos(this.character.angle);
            var y = move * Math.cos(this.character.angle) - strafe * Math.sin(this.character.angle);
            var len = x*x + y*y;
            if (len > 0) {
                this.physics.force.x = this.character.speed*force * x / len;
                this.physics.force.y = this.character.speed*force * y / len;
            }

            //var reticle = engine.entity_manager.getComponentsForEntity(this.player.reticle);
            //reticle.position.x = this.position.x - this.player.reticle_distance*Math.sin(this.player.angle);
            //reticle.position.y = this.position.y - this.player.reticle_distance*Math.cos(this.player.angle);
            //reticle.angle = -this.player.angle;
            game.scripts.character_think.apply(this, [engine, dt]);
        },
        character_think: function(engine, dt) {
            //console.log(this);
            this.physics.torque = -this.character.turn_speed*(this.angle + this.character.angle);
        }
    }
})(typeof exports === 'undefined' ? this['game'] : exports);
