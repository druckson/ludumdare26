if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    exports.Audio = function() {
        this.components = ["position", "sounds"];
        createjs.Sound.initializeDefaultPlugins()
    };

    exports.Audio.prototype.init = function(engine) {
        var self = this;
        this.engine = engine;
        _.each(this.engine.entity_manager.getEntitiesWithComponents(this.components), function(entity) {
            _.each(entity.sounds, function(sound, name) {
                var source = "";
                _.each(sound, function(path, type) {
                    source += path;
                });
                createjs.Sound.addEventListener("fileload", function(e) {
                    sound.instance = createjs.Sound.play(source);
                });
                createjs.Sound.registerSound(source);
            });
        });
    };

    exports.Audio.prototype.think = function(dt) {
        var self = this;
        _.each(this.engine.entity_manager.getEntitiesWithComponents(this.components), function(entity) {
        });
    };
})(typeof exports === 'undefined'? this['engine']: exports);
