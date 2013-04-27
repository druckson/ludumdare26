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
            var fixDef = new Box2D.Dynamics.b2FixtureDef();
            _.each(self.fixProps, function(prop) {
                if (prop in entity.physics)
                    fixDef[prop] = entity.physics[prop];
            });
            var bodyDef = new Box2D.Dynamics.b2BodyDef();
            _.each(self.bodyProps, function(prop) {
                if (prop in entity.physics)
                    bodyDef[prop] = entity.physics[prop];
            });
            bodyDef.userData = entity.entity;
            bodyDef.position.Set(entity.position.x, entity.position.y);
            bodyDef.angularVelocity = 0;
            bodyDef.angularDamping = 20;
            fixDef.friction = 0.1;
            fixDef.density = 1;
            switch(entity.physics.shape.type) {
            case "rect":
                var shape = new Box2D.Collision.Shapes.b2PolygonShape();
                shape.SetAsBox(entity.physics.shape.width/2, entity.physics.shape.height/2);
                fixDef.shape = shape;
                break;
            case "circle":
                var shape = new Box2D.Collision.Shapes.b2CircleShape(entity.physics.shape.radius);
                fixDef.shape = shape;
                break;
            }
            var body = self.world.CreateBody(bodyDef)
            var fixture = body.CreateFixture(fixDef);
            entity.physics.body = body;
            entity.physics.fixture = fixture;
        });
    };

    exports.Physics.prototype.think = function(dt) {
        this.world.Step(dt, this.velocityIterations, this.positionIterations);
        this.world.ClearForces();

        var body = this.world.GetBodyList();
        while (body.m_next) {
            var entity = this.engine.entity_manager.getComponentsForEntity(body.m_userData);
            if ("force" in entity.physics)
                body.ApplyForce(new Box2D.Common.Math.b2Vec2(entity.physics.force.x, entity.physics.force.y),
                                new Box2D.Common.Math.b2Vec2(entity.position.x, entity.position.y));
            if ("player" in entity) {
                var torque = -4*(entity.angle + entity.player.angle);
                body.ApplyTorque(torque);
            }
            this.engine.entity_manager.setComponent(body.m_userData, "position", body.GetPosition());
            this.engine.entity_manager.setComponent(body.m_userData, "angle", body.GetAngle());
            body = body.m_next;
        }
    };
})(typeof exports === 'undefined'? this['engine']: exports);
