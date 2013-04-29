if (typeof engine === "undefined") { engine = {}; }

(function(exports) {
    exports.Display = function(cameraHeight, cameraFollow) {
        this.components = ["position", "graphics"];
        this.cameraHeight = cameraHeight;
        this.cameraFollow = cameraFollow;
    };

    exports.Display.prototype.init = function(engine) {
        var self = this;
        this.engine = engine;
        this.scene = new THREE.Scene();

        this.rectGeometry = new THREE.PlaneGeometry(1, 1);
        this.circleGeometry = new THREE.SphereGeometry(1, 18, 8);

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 100000 );
        this.camera.position.set(0, 0, this.cameraHeight);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        var ambientLight = new THREE.AmbientLight(0xFFFFFF);
        this.scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFEECC, 5.0, 0);
        directionalLight.position.set(0, 0.0, 100.0).normalize();
        this.scene.add(directionalLight);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        //this.renderer.setClearColor( new THREE.Color(0x000033) );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );
        window.addEventListener( 'resize', function() {
            self.camera.aspect = window.innerWidth / window.innerHeight;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize( window.innerWidth, window.innerHeight );
        }, false);

        var sheets = {};

        var entities = this.engine.entity_manager.getEntitiesWithComponents(this.components)
        _.each(entities, function(entity) {
            var mesh, geometry, material;

            switch (entity.graphics.type) {
            case "sprite":
                var sheet = entity.graphics.sheet;
                if (!(sheet in sheets)) {
                    var texture = THREE.ImageUtils.loadTexture(sheet);
                    texture.magFilter = THREE.NearestFilter;
                    sheets[sheet] = {
                        file: sheet,
                        statics: new THREE.Geometry(),
                        material: new THREE.MeshBasicMaterial({ map: texture, transparent: entity.graphics.transparency, overdraw: true }),
                        width: entity.graphics.sheet_width,
                        height: Math.ceil(entity.graphics.sheet_length / entity.graphics.sheet_width),
                        length: entity.graphics.sheet_length,
                        level: entity.graphics.level,
                        sprites: {}
                    }
                }
                var si = entity.graphics.sheet_idx;
                if (si == -1) si = Math.random(0, entity.graphics.sheet_length);
                var sprite = sheets[sheet].sprites[si];
                if (typeof sprite === "undefined") {
                    sprite = new THREE.Geometry();
                    var sw = sheets[sheet].width;
                    var sh = sheets[sheet].height;
                    var sx = si % sw;
                    var sy = sh - Math.floor(si / sw) - 1;

                    var w = 0.5;
                    var h = 0.5;
                    var vertOffset = sprite.vertices.length;
                    var faceOffset = sprite.faces.length;
                    var uvOffset =   sprite.faceVertexUvs[0].length;

                    sprite.vertices.push(new THREE.Vector3(-w, -h, 0));
                    sprite.vertices.push(new THREE.Vector3(+w, -h, 0));
                    sprite.vertices.push(new THREE.Vector3(+w, +h, 0));
                    sprite.vertices.push(new THREE.Vector3(-w, +h, 0));
                    sprite.faces.push(new THREE.Face4(vertOffset, vertOffset+1, vertOffset+2, vertOffset+3));
                    sprite.faceVertexUvs[0].push([
                        new THREE.Vector2( 1/sw*(sx+0), 1/sh*(sy+0) ),
                        new THREE.Vector2( 1/sw*(sx+1), 1/sh*(sy+0) ),
                        new THREE.Vector2( 1/sw*(sx+1), 1/sh*(sy+1) ),
                        new THREE.Vector2( 1/sw*(sx+0), 1/sh*(sy+1) )
                    ]);
                    sheets[sheet].sprites[entity.graphics.sheet_idx] = sprite;
                }

                //var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
                mesh = new THREE.Mesh(sprite, sheets[sheet].material);

                if (entity.graphics.width)
                    mesh.scale.x = entity.graphics.width;
                if (entity.graphics.height)
                    mesh.scale.y = entity.graphics.height;

                break;
            case "shape":
                material = new THREE.MeshBasicMaterial({ color: entity.graphics.color });
                switch(entity.graphics.shape.type) {
                case "rect":
                    mesh = new THREE.Mesh(this.rectGeometry, material);
                    mesh.scale.x = entity.graphics.shape.width;
                    mesh.scale.y = entity.graphics.shape.height;
                    break;
                case "circle":
                    mesh = new THREE.Mesh(this.circleGeometry, material);
                    mesh.scale.x = entity.graphics.shape.radius;
                    mesh.scale.y = entity.graphics.shape.radius;
                    break;
                }
                break;
            }

            mesh.position.x = entity.position.x;
            mesh.position.y = -entity.position.y;
            mesh.position.z = entity.graphics.level;

            if (entity.graphics.static) {
                THREE.GeometryUtils.merge(sheets[sheet].statics, mesh);
            } else {
                console.log("Dynamic Mesh");
                entity.graphics.mesh = mesh;
                self.scene.add(entity.graphics.mesh);
            }
        });

        _.each(sheets, function(sheet) {
            console.log("Static Mesh");
            var mesh = new THREE.Mesh(sheet.statics, sheet.material);
            self.scene.add(mesh);
        });
    };

    exports.Display.prototype.think = function(dt) {
        var self = this;
        _.each(this.engine.entity_manager.getEntitiesWithComponents(this.components), function(entity) {
            if ("mesh" in entity.graphics) {
                entity.graphics.mesh.position.x = entity.position.x;
                entity.graphics.mesh.position.y = -entity.position.y;
                if ("level" in entity.graphics)
                    entity.graphics.mesh.position.z = entity.graphics.level;
                if ("angle" in entity)
                    entity.graphics.mesh.rotation.z = -entity.angle;
            }
            if ("player" in entity) {
                self.camera.position.set(entity.position.x - Math.sin(-entity.character.angle)*self.cameraFollow,
                                    -entity.position.y + Math.cos(-entity.character.angle)*self.cameraFollow, self.cameraHeight);
                self.camera.rotation.set(0, 0, -entity.character.angle);
            }
        });
        this.renderer.render(this.scene, this.camera);
    };
})(typeof exports === 'undefined'? this['engine']: exports);
