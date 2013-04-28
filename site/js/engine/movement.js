if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    exports.Movement = function() {
        this.components = ["position", "physics", "character"];
    };

    exports.Movement.prototype.init = function(engine) {
        var self = this;
        this.engine = engine;
    };

    exports.Movement.prototype.think = function(dt) {
        var entities = this.engine.entity_manager.getEntitiesWithComponents(this.components);
        _.each(entities, function(entity) {
            var turn_direction = entity.angle - entity.character.angle;
            if (turn_direction >= Math.PI)
                turn_direction += Math.PI;
            if (turn_direction <= -Math.PI)
                turn_direction -= Math.PI
            entity.physics.torque = -entity.character.turn_speed*turn_direction;

            var x = -entity.character.move * Math.sin(entity.character.angle) +
                    entity.character.strafe * Math.cos(entity.character.angle);
            var y = entity.character.move * Math.cos(entity.character.angle) +
                    entity.character.strafe * Math.sin(entity.character.angle);
            var len = x*x + y*y;

            if (len > 0) {
                entity.physics.force.x = entity.character.speed * x / len;
                entity.physics.force.y = entity.character.speed * y / len;
            }
        });
    };
})(typeof exports === 'undefined'? this['engine']: exports);
