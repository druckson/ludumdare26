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

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 100000 );
        this.camera.position.set(0, 0, this.cameraHeight);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        var ambientLight = new THREE.AmbientLight(0xFFFFFF);
        this.scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFEECC, 5.0, 0);
        directionalLight.position.set(0, 0.0, 100.0).normalize();
        this.scene.add(directionalLight);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setClearColorHex( 0x000033, 1 );
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
                        geometry: new THREE.Geometry(),
                        material: new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
                        width: entity.graphics.sheet_width,
                        height: Math.ceil(entity.graphics.sheet_length / entity.graphics.sheet_width),
                        length: entity.graphics.sheet_length,
                        level: entity.graphics.level
                    }
                }
                var tx=0, ty=0;

                if (entity.graphics.static) {
                    geometry = sheets[sheet].geometry;
                    tx = entity.position.x;
                    ty = entity.position.y;
                } else {
                    material = sheets[sheet].material;
                    geometry = new THREE.Geometry();
                }

                var sw = sheets[sheet].width;
                var sh = sheets[sheet].height;
                var si = entity.graphics.sheet_idx;
                if (si == -1) si = Math.random(0, entity.graphics.sheet_length);
                var sx = si % sw;
                var sy = sh - Math.floor(si / sw) - 1;

                var w = 0.5;
                var h = 0.5;
                var vertOffset = geometry.vertices.length;
                var faceOffset = geometry.faces.length;
                var uvOffset =   geometry.faceVertexUvs[0].length;

                if (entity.graphics.width)
                    w *= entity.graphics.width;
                if (entity.graphics.height)
                    h *= entity.graphics.height;

                geometry.vertices.push(new THREE.Vector3(tx-w, -ty-h, 0));
                geometry.vertices.push(new THREE.Vector3(tx+w, -ty-h, 0));
                geometry.vertices.push(new THREE.Vector3(tx+w, -ty+h, 0));
                geometry.vertices.push(new THREE.Vector3(tx-w, -ty+h, 0));
                geometry.faces.push(new THREE.Face4(vertOffset, vertOffset+1, vertOffset+2, vertOffset+3));
                geometry.faceVertexUvs[0].push([
                    new THREE.UV( 1/sw*(sx+0), 1/sh*(sy+0) ),
                    new THREE.UV( 1/sw*(sx+1), 1/sh*(sy+0) ),
                    new THREE.UV( 1/sw*(sx+1), 1/sh*(sy+1) ),
                    new THREE.UV( 1/sw*(sx+0), 1/sh*(sy+1) )
                ]);

                if (!entity.graphics.static)
                    entity.graphics.mesh = new THREE.Mesh(geometry, material);
                break;
            case "shape":
                material = new THREE.MeshBasicMaterial({ color: entity.graphics.color });
                switch(entity.graphics.shape.type) {
                case "rect":
                    geometry = new THREE.PlaneGeometry(entity.graphics.shape.width, entity.graphics.shape.height);
                    break;
                case "circle":
                    geometry = new THREE.SphereGeometry(entity.graphics.shape.radius, 18, 8);
                    break;
                }
                entity.graphics.mesh = new THREE.Mesh(geometry, material);
                break;
            }

            if (!entity.graphics.static) {
                entity.graphics.mesh.position.x = entity.position.x;
                entity.graphics.mesh.position.y = -entity.position.y;
                entity.graphics.mesh.position.z = entity.graphics.level;
                self.scene.add(entity.graphics.mesh);
            }
        });

        _.each(sheets, function(sheet) {
            var mesh = new THREE.Mesh(sheet.geometry, sheet.material);
            mesh.position.z = sheet.level;
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
                self.camera.position.set(entity.position.x - Math.sin(entity.character.angle)*self.cameraFollow,
                                    -entity.position.y + Math.cos(entity.character.angle)*self.cameraFollow, self.cameraHeight);
                self.camera.rotation.set(0, 0, entity.character.angle);
            }
        });
        this.renderer.render(this.scene, this.camera);
    };
})(typeof exports === 'undefined'? this['engine']: exports);
