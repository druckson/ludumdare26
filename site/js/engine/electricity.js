if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    exports.Electricity = function() {
        this.components = [];
    };

    exports.Electricity.prototype.init = function(engine) {
        this.engine = engine;
    };

    exports.Electricity.prototype.think = function(dt) {

    };
})(typeof exports === 'undefined' ? this['engine'] : exports);
