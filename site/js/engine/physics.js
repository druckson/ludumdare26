if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    exports.Physics = function(velocityIterations, positionIterations, drag) {
        this.components = ["position", "physics"];
        this.velocityIterations = velocityIterations;
        this.positionIterations = positionIterations;
        this.drag = drag;

        this.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 0), true);
        this.fixProps = ["density", "friction", "restitution", "isSensor"];
        this.bodyProps = ["bullet", "type", "fixedRotation", "linearDamping", "angularDamping", "inertiaScale", "allowSleep"];
    };

    exports.Physics.prototype.init = function(engine) {
        var self = this;
        this.engine = engine;
        var entities = this.engine.entity_manager.getEntitiesWithComponents(this.components);
        _.each(entities, function(entity) {
            var bodyDef = new Box2D.Dynamics.b2BodyDef();
            bodyDef.userData = entity.entity;
            bodyDef.position.Set(entity.position.x, entity.position.y);
            bodyDef.angularVelocity = 0;
            bodyDef.angularDamping = 20;
            _.each(self.bodyProps, function(prop) {
                if (prop in entity.physics)
                    bodyDef[prop] = entity.physics[prop];
            });

            var fixDef = new Box2D.Dynamics.b2FixtureDef();
            fixDef.friction = 0.1;
            fixDef.density = 1;
            _.each(self.fixProps, function(prop) {
                if (prop in entity.physics)
                    fixDef[prop] = entity.physics[prop];
            });

            var body = self.world.CreateBody(bodyDef)
            _.each(entity.physics.shapes, function(shape) {
                switch(shape.type) {
                case "rect":
                    var new_shape = new Box2D.Collision.Shapes.b2PolygonShape();
                    new_shape.SetAsBox(shape.width/2, shape.height/2);
                    fixDef.shape = new_shape;
                    break;
                case "circle":
                    var new_shape = new Box2D.Collision.Shapes.b2CircleShape(shape.radius);
                    fixDef.shape = new_shape;
                    break;
                default:
                    console.log("Invalid shape type");
                    break;
                }
                body.CreateFixture(fixDef);
            });
            entity.physics.body = body;
        });
    };

    exports.Physics.prototype.think = function(dt) {
        this.world.Step(dt, this.velocityIterations, this.positionIterations);
        this.world.ClearForces();

        var body = this.world.GetBodyList();
        while (body.m_next) {
            var entity = this.engine.entity_manager.getComponentsForEntity(body.m_userData);
            if ("force" in entity.physics) {
                body.ApplyForce(new Box2D.Common.Math.b2Vec2(entity.physics.force.x, entity.physics.force.y),
                                new Box2D.Common.Math.b2Vec2(entity.position.x, entity.position.y));
            }
            if ("torque" in entity.physics) {
                body.ApplyTorque(entity.physics.torque);
            }
            this.engine.entity_manager.setComponent(body.m_userData, "position", body.GetPosition());
            this.engine.entity_manager.setComponent(body.m_userData, "angle", body.GetAngle());
            body = body.m_next;
        }
    };
})(typeof exports === 'undefined'? this['engine']: exports);
