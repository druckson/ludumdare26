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
            var search = new Box2D.Common.Math.b2Vec2(0, 0);
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

                    // Search
                    if (entity.bot.search && dist < entity.bot.search.distance &&
                        other.player && !other.player.invisible) {
                        var temp = new Box2D.Common.Math.b2Vec2(diff.x, diff.y);
                        temp.Multiply(100);
                        if (other.player.repel)
                            search.Add(temp);
                        else
                            search.Subtract(temp);
                    }

                    // Follow
                    if (entity.bot.follow && dist < entity.bot.follow.distance) {
                        follow.Add(other.physics.body.m_linearVelocity);
                    }
                }
            });

            if (search.Length() > 0) {
                search.Normalize();
                search.Multiply(entity.bot.search.force);
                force.Add(search);
            }
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
                var relax = 0;
                var new_angle = (Math.PI/2+Math.atan2(force.y, force.x)) % (2*Math.PI);
                entity.character.angle = relax*entity.character.angle +
                                         (1-relax)*new_angle;
                var speed = Math.sin(entity.character.angle)*force.x + Math.cos(entity.character.angle)*force.y;
                if (speed < 0)
                    entity.character.speed = entity.character.max_speed;
                //entity.character.speed = Math.min(Math.max(0, -speed*10), entity.character.max_speed);

                entity.character.move = -1;
                //entity.character.strafe = force.x;
            } else {
                entity.character.angle = entity.angle;
                entity.character.speed = 0;
                entity.character.move = 0;
            }
        });
    };
})(typeof exports === 'undefined'? this['engine']: exports);
