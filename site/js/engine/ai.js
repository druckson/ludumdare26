if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    exports.AI = function() {
        this.components = ["position", "physics", "bot"];
    };

    exports.AI.prototype.init = function(engine) {
        var self = this;
        this.engine = engine;
        var entities = this.engine.entity_manager.getEntitiesWithComponents(this.components);
        _.each(entities, function(entity) {
            entity.physics.force = new Box2D.Common.Math.b2Vec2(0, 0);
            entity.character.move = 0;
            entity.character.strafe = 0;
            entity.character.max_speed = entity.character.speed;
        });
    };

    exports.AI.prototype.think = function(dt) {
        var entities = this.engine.entity_manager.getEntitiesWithComponents(this.components);
        var characters = this.engine.entity_manager.getEntitiesWithComponents(["character"]);
        _.each(entities, function(entity) {
            var force = new Box2D.Common.Math.b2Vec2(0, 0);
            var spread = new Box2D.Common.Math.b2Vec2(0, 0);
            var gather = new Box2D.Common.Math.b2Vec2(0, 0);
            var follow = new Box2D.Common.Math.b2Vec2(0, 0);
            _.each(characters, function(other) {
                if (entity != other) {
                    var diff = new Box2D.Common.Math.b2Vec2(entity.position.x - other.position.x,
                                                            entity.position.y - other.position.y);
                    var dist = diff.Length();

                    // Spread
                    if (entity.bot.spread && dist < entity.bot.spread.distance) {
                        spread.Add(diff);
                    }

                    // Gather
                    if (entity.bot.gather && dist < entity.bot.gather.distance) {
                        gather.Subtract(diff);
                    }

                    // Follow
                    if (entity.bot.follow && dist < entity.bot.follow.distance) {
                        follow.Add(other.physics.body.m_linearVelocity);
                    }
                }
            });
            if (spread.Length() > 0) {
                spread.Normalize();
                spread.Multiply(entity.bot.spread.force);
                force.Add(spread);
            }
            if (gather.Length() > 0) {
                gather.Normalize();
                gather.Multiply(entity.bot.gather.force);
                force.Add(gather);
            }
            if (follow.Length() > 0) {
                follow.Normalize();
                follow.Multiply(entity.bot.follow.force);
                force.Add(follow);
            }

            if (force.Length() > 0) {
                var relax = 0.8;
                var new_angle = -Math.atan2(force.y, force.x);
                entity.character.angle = relax*entity.character.angle +
                                         (1-relax)*new_angle;
                entity.character.speed = Math.min(force.Length(), entity.character.max_speed);

                entity.character.move = -1;
                //entity.character.strafe = force.x;
            }
        });
    };
})(typeof exports === 'undefined'? this['engine']: exports);
