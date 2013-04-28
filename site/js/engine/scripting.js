if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    exports.Scripting = function(scripts) {
        this.components = ['scripts'];
        this.scripts = scripts;
    };

    exports.Scripting.prototype.init = function(engine) {
        var self = this;
        this.engine = engine;
        var entities = this.engine.entity_manager.getEntitiesWithComponents(this.components);
        _.each(entities, function(entity) {
            if ("init" in entity.scripts) {
                self.scripts[entity.scripts.init].apply(entity, [self.engine]);
            }
        });
    };

    exports.Scripting.prototype.think = function(dt) {
        var self = this;
        var entities = this.engine.entity_manager.getEntitiesWithComponents(this.components);
        _.each(entities, function(entity) {
            if ("think" in entity.scripts) {
                self.scripts[entity.scripts.think].apply(entity, [self.engine, dt]);
            }
        });
    };

    exports.Scripting.prototype.destroy = function(entity_list) {
        var self = this;
        var entities = this.engine.entity_manager.getEntitiesWithComponents(this.components);
        _.each(entities, function(entity) {
            if (entity.entity in entity_list) {
                
            }
        });
    };
})(typeof exports === 'undefined' ? this['engine'] : exports);
