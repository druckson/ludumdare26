if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    exports.EntityManager = function() {
        this.nextEntity = 0;
        this.entities = {};
        this.components = {};
        this.entity_cache = {};
    }

    exports.EntityManager.prototype.newEntity = function() {
        var entity = this.nextEntity++;
        this.entities[entity] = {entity: entity};
        return entity;
    };

    exports.EntityManager.prototype.setComponent = function(entity, component, data) {
        if (!(component in this.components)) { this.components[component] = []; }
        this.components[component][entity] = data;
        this.entities[entity][component] = data;
    };

    exports.EntityManager.prototype.setComponents = function(entity, components) {
        var self = this;
        _.each(components, function(data, component) {
            self.setComponent(entity, component, data);
        });
    };

    exports.EntityManager.prototype.getEntitiesWithComponent = function(component) {
        return _.keys(this.components[component]);
    };

    exports.EntityManager.prototype.getComponentsForEntity = function(entity) {
        return this.entities[entity];
    };

    exports.EntityManager.prototype.getComponentsForEntities = function(entity_list) {
        return _.map(entity_list, function(entity) {
            return this.entities[entity];
        });
    };

    exports.EntityManager.prototype.getEntitiesWithComponents = function(components) {
        var key = _.reduce(components, function(memo, component) {
            return memo + component;
        }, "")

        if (!(key in this.entity_cache)) {
            this.entity_cache[key] = _.filter(this.entities, function(entity) {
                for (var c in components) {
                    if (!(components[c] in entity))
                        return false;
                }
                return true;
            });
        }
        return this.entity_cache[key];
    };
})(typeof exports === 'undefined'? this['engine']: exports);
