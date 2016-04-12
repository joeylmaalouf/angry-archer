function makeRenderer(Physics) {
    Physics.renderer('pixi-scalable', function( parent ){
    
        if ( !document ){
            // must be in node environment
            return {};
        }
        this.viewScale = 1; // Custom var: size of viewport relative to default
        var defaultHeight;
        var Pi2 = Math.PI * 2
            ,colors = {
                white: '0xFFFFFF'
                ,violet: '0x542437'
                ,blue: '0x53777A'
            }
            ,fontStyles = {
                font: "18px monospace",
                fill: "black",
                align: "left"
            }
    
            ,defaults = {
    
                // the element to place meta data into
                metaEl: null,
                offset: { x: 0, y: 0 },
                // Provide some default colours
                styles: {
                    // Defines the default canvas colour
                    'color': false,
    
                    'point': colors.blue,
    
                    'circle' : {
                        strokeStyle: colors.blue,
                        lineWidth: 1,
                        fillStyle: colors.blue,
                        angleIndicator: colors.white,
                        fillAlpha: 1,
                        strokeAlpha: 1,
                        alpha: 1
                    },
    
                    'rectangle' : {
                        strokeStyle: colors.violet,
                        lineWidth: 1,
                        fillStyle: colors.violet,
                        angleIndicator: colors.white,
                        fillAlpha: 1,
                        strokeAlpha: 1,
                        alpha: 1
                    },
    
                    'convex-polygon' : {
                        strokeStyle: colors.violet,
                        lineWidth: 1,
                        fillStyle: colors.violet,
                        angleIndicator: colors.white,
                        fillAlpha: 1,
                        strokeAlpha: 1,
                        alpha: 1
                    }
                }
            }
            ;
    
        return {
    
            // extended
            init: function( options ){
                defaultHeight = options.worldsize.h;
                var self = this
                    ,el
                    ,isTransparent
                    ;
    
                if (typeof PIXI === 'undefined') {
                    throw "PIXI not present - cannot continue";
                }
                
                // call parent init
                parent.init.call(this, options);
    
                // further options
                this.options.defaults( defaults, true );
                this.options.onChange(function(){
                    self.options.offset = new Physics.vector( self.options.offset );
                });
                this.options( options, true );
    
                isTransparent = (!this.options.styles.color || this.options.styles.color === 'transparent');
                // Hook in PIXI stage here
                this.stage = new PIXI.Stage(this.options.styles.color);
    
                // Create empty meta object for use later
                this.meta = {};
    
                el = (this.el && this.el.nodeName === 'CANVAS') ? el : null;
                // add the renderer view element to the DOM according to its type
                this.renderer = new PIXI.autoDetectRenderer(this.options.width, this.options.height, {
                    view: el,
                    transparent: isTransparent,
                    resolution: window.devicePixelRatio || 1
                });
    
                if ( !el ){
                    this.el = this.el || document.body;
                    // add to passed in element
                    this.el.appendChild( this.renderer.view );
                }
    
                if ( this.options.autoResize ){
                    this.resize();
                } else {
                    this.resize( this.options.width, this.options.height );
                }
            },
    
            // extended
            resize: function( width, height ){
    
                parent.resize.call( this, width, height );
                this.renderer.resize( this.width, this.height );
                if (height) {
                    this.viewScale = height/defaultHeight;
                } else {
                    this.viewScale = 1;
                }
                
            },
    
            // extended
            connect: function( world ){
    
                world.on( 'add:body', this.attach, this );
                world.on( 'remove:body', this.detach, this );
            },
    
            // extended
            disconnect: function( world ){
    
                world.off( 'add:body', this.attach, this );
                world.off( 'remove:body', this.detach, this );
            },
    
            /**
             * PixiRenderer#detach( data ) -> this
             * - data (PIXI.Graphics|Object): Graphics object or event data (`data.body`)
             *
             * Event callback to detach a child from the stage
             **/
            detach: function( data ){
    
                // interpred data as either dom node or event data
                var el = (data instanceof PIXI.Graphics && data) || (data.body && data.body.view);
    
                if ( el ){
                    // remove view from dom
                    this.stage.removeChild( el );
                }
    
                return this;
            },
    
            /**
             * PixiRenderer#attach( data ) -> this
             * - data (PIXI.Graphics|Object): Graphics object or event data (`data.body`)
             *
             * Event callback to attach a child to the stage
             **/
            attach: function( data ){
    
                // interpred data as either dom node or event data
                var el = (data instanceof PIXI.Graphics && data) || (data.body && data.body.view);
    
                if ( el ){
                    // attach to viewport
                    this.stage.addChild( el );
                }
    
                return this;
            },
    
            /**
             * PixiRenderer#loadSpriteSheets( assetsToLoad, callback ) -> this
             * - assetsToLoad (Array): Array of spritesheets to load
             * - callback (Function): Function to call when loading is complete
             *
             * Loads textures defined in a spritesheet
             **/
            loadSpriteSheets: function( assetsToLoad, callback ){
    
                if ( !Physics.util.isArray( assetsToLoad ) ) {
                    throw 'Spritesheets must be defined in arrays';
                }
    
                var self = this
                    ,loader = new PIXI.AssetLoader(assetsToLoad)
                    ;
    
                // Start loading resources!
                loader.load();
    
                loader.on('onComplete', function(evt){
                    self.assetsLoaded = true;
                    callback();
                });
    
                return self;
            },
    
            /**
             * PixiRenderer#drawBody( body, view )
             * - body (Body): The body to draw
             * - view (DisplayObject): The pixi display object
             *
             * Draw a PIXI.DisplayObject to the stage.
             **/
            drawBody: function( body, view ){
                var pos = body.state.pos
                    ,v = body.state.vel
                    ,os = body.offset
                    ,t = this._interpolateTime || 0
                    ,x
                    ,y
                    ,ang
                    ;
    
                // interpolate positions
                // scale object to maintain size relative to viewport
                view.scale.x = this.viewScale;
                view.scale.y = this.viewScale;
                x = (pos._[0] + v._[0] * t) * this.viewScale;
                y = (pos._[1] + v._[1] * t) * this.viewScale;
                ang = body.state.angular.pos + body.state.angular.vel * t;
    
                view.position.set( x, y );
                view.pivot.set( -os._[0], -os._[1] );
                view.rotation = ang;
            },
    
            // extended
            render: function( bodies, meta ){
    
                parent.render.call(this, bodies, meta);
                this.renderer.render(this.stage);
            },
    
            /**
             * PixiRenderer#setStyles( graphics, styles ) -> PIXI.Graphics
             * - graphics (PIXI.Graphics): The graphics object to set styles on
             * - styles (Object): The styles configuration
             * + (PIXI.Graphics): A graphic object
             *
             * Set styles on pixi graphics object
             **/
            setStyles: function( graphics, styles ){
    
                if ( Physics.util.isObject(styles) ){
    
                    if ( styles.fillStyle && styles.fillStyle !== 'transparent' ){
                        graphics.beginFill( styles.fillStyle );
                        graphics.fillAlpha = styles.fillAlpha !== undefined ? styles.fillAlpha : 1;
                    } else {
                        graphics.beginFill();
                        graphics.fillAlpha = 0;
                    }
    
                    graphics.lineStyle( styles.lineWidth || 0, styles.strokeStyle, styles.strokeAlpha !== undefined ? styles.strokeAlpha : 1 );
                    graphics.alpha = styles.alpha !== undefined ? styles.alpha : 1;
    
                } else {
    
                    if ( styles && styles !== 'transparent' ){
                        graphics.beginFill( styles );
                    } else {
                        graphics.beginFill();
                        graphics.fillAlpha = 0;
                    }
    
                    graphics.lineStyle( 0 );
                }
    
                return graphics;
            },
    
            /**
             * PixiRenderer#createCircle( x, y, r, styles ) -> PIXI.Graphics
             * - x (Number): The x coord
             * - y (Number): The y coord
             * - r (Number): The circle radius
             * - styles (Object): The styles configuration
             * + (PIXI.Graphics): A graphic object representing a circle.
             *
             * Create a circle for use in PIXI stage
             **/
            createCircle: function( x, y, r, styles ){
    
                var graphics = new PIXI.Graphics();
                this.setStyles( graphics, styles );
                graphics.drawCircle( x, y, r );
                graphics.endFill();
                return graphics;
            },
    
            /**
             * PixiRenderer#createRect( x, y, r, styles ) -> PIXI.Graphics
             * - x (Number): The x coord
             * - y (Number): The y coord
             * - width (Number): The rectangle width
             * - height (Number): The rectangle height
             * - styles (Object): The styles configuration
             * + (PIXI.Graphics): A graphic object representing a circle.
             *
             * Create a rectangle for use in PIXI stage
             **/
            createRect: function( x, y, width, height, styles ){
    
                var graphics = new PIXI.Graphics();
                this.setStyles( graphics, styles );
                graphics.drawRect( x, y, width, height );
                graphics.endFill();
                return graphics;
            },
    
            /**
             * PixiRenderer#createPolygon( verts, styles ) -> PIXI.Graphics
             * - verts (Array): Array of [[Vectorish]] vertices
             * - styles (Object): The styles configuration
             * + (PIXI.Graphics): A graphic object representing a polygon.
             *
             * Create a polygon for use in PIXI stage
             **/
            createPolygon: function( verts, styles ){
    
                var vert = verts[0]
                    ,x = vert.x
                    ,y = vert.y
                    ,l = verts.length
                    ,start = {
                        x: x
                        ,y: y
                    }
                    ,graphics = new PIXI.Graphics()
                    ;
    
                this.setStyles( graphics, styles );
    
                graphics.moveTo(x, y);
    
                for ( var i = 1; i < l; ++i ){
    
                    vert = verts[ i ];
                    x = vert.x;
                    y = vert.y;
                    graphics.lineTo(x, y);
                }
    
                if (l > 2){
                    graphics.lineTo(start.x, start.y);
                }
    
                graphics.endFill();
                return graphics;
            },
    
            /**
             * PixiRenderer#createLine( from, to, styles ) -> PIXI.Graphics
             * - from (Vectorish): Starting point
             * - to (Vectorish): Ending point
             * - styles (Object): The styles configuration
             * + (PIXI.Graphics): A graphic object representing a polygon.
             *
             * Create a line for use in PIXI stage
             **/
            createLine: function( from, to, styles ){
    
                var x = from.x
                    ,y = from.y
                    ;
    
                var graphics = new PIXI.Graphics();
                this.setStyles( graphics, styles );
    
                graphics.moveTo(x, y);
    
                x = to.x;
                y = to.y;
    
                graphics.lineTo(x, y);
    
                graphics.endFill();
                return graphics;
            },
    
            // extended
            createView: function( geometry, styles, parent ){
    
                var view = null
                    ,aabb = geometry.aabb()
                    ,hw = aabb.hw + Math.abs(aabb.x)
                    ,hh = aabb.hh + Math.abs(aabb.y)
                    ,name = geometry.name
                    ;
    
                parent = parent || this.stage;
                styles = styles || this.options.styles[ name ] || this.options.styles.circle || {};
    
                // must want an image
                if ( styles.src ){
                    view = PIXI.Sprite.fromImage( styles.src );
                    view.anchor.set( 0.5, 0.5 );
                    if ( styles.anchor ) {
                        view.anchor.x = styles.anchor.x;
                        view.anchor.y = styles.anchor.y;
                    }
                    if ( styles.width ){
                        view.width = styles.width;
                    }
                    if ( styles.height ){
                        view.height = styles.height;
                    }
                    parent.addChild(view);
                    return view;
                }
    
                if (name === 'circle'){
    
                    view = this.createCircle(0, 0, geometry.radius, styles);
    
                } else if (name === 'convex-polygon'){
    
                    view = this.createPolygon(geometry.vertices, styles);
    
                } else if (name === 'rectangle'){
    
                    view = this.createRect(-geometry.width/2, -geometry.height/2, geometry.width, geometry.height, styles);
                } else if (name === 'compound'){
    
                    view = new PIXI.Graphics();
    
                    for ( var i = 0, l = geometry.children.length, ch, chview; i < l; i++ ){
                        ch = geometry.children[ i ];
                        chview = this.createView( ch.g, styles, view );
                        chview.position.set( ch.pos.x, ch.pos.y );
                        chview.rotation = ch.angle;
                    }
                } else {
    
                    // assume it's a point
                    view = this.createCircle(0, 0, 1, styles);
                }
    
                if ( name !== 'compound' && styles.angleIndicator && styles.angleIndicator !== 'transparent' ){
    
                    view.lineStyle( styles.lineWidth, styles.angleIndicator );
                    view.moveTo( 0, 0 );
                    view.lineTo( hw, 0 );
                }
    
                if ( name !== 'compound' ){
                    view.cacheAsBitmap = true;
                }
    
                parent.addChild(view);
                return view;
            },
    
            // extended
            drawMeta: function( meta ){
                if (!this.meta.loaded){
                    // define the font styles here
                    this.meta.fps = new PIXI.Text('FPS: ' + meta.fps.toFixed(2), fontStyles);
                    this.meta.fps.position.x = 15;
                    this.meta.fps.position.y = 5;
    
                    this.meta.ipf = new PIXI.Text('IPF: ' + meta.ipf, fontStyles);
                    this.meta.ipf.position.x = 15;
                    this.meta.ipf.position.y = 30;
    
                    this.stage.addChild(this.meta.fps);
                    this.stage.addChild(this.meta.ipf);
                    this.meta.loaded = true;
                } else {
                    this.meta.fps.setText('FPS: ' + meta.fps.toFixed(2));
                    this.meta.ipf.setText('IPF: ' + meta.ipf);
                }
            },
    
            /**
             * PixiRenderer#createDisplay( type, options ) -> PIXI.DisplayObject
             * - type (String): The type of PIXI.DisplayObject to make
             * - options (Object): Options to apply to the view.
             * + (PIXI.DisplayObject): An object that is renderable.
             *
             * Create a PIXI sprite or movie clip.
             **/
            createDisplay: function( type, options ){
                var view = null
                    ,texture = null
                    ;
                switch (type){
                    // Create a sprite object
                    case 'sprite':
                        texture = PIXI.Texture.fromImage(options.texture);
                        view = new PIXI.Sprite(texture);
                        if (options.anchor ) {
                            view.anchor.x = options.anchor.x;
                            view.anchor.y = options.anchor.y;
                        }
                        // If a container is specified, use add to that container
                        if (options.container) {
                            options.container.addChild(view);
                        } else {
                            // Otherwise just add the view to the stage
                            this.stage.addChild(view);
                        }
                        return view;
                    // Create a movieclip object
                    case 'movieclip':
                        if (!this.assetsLoaded) {
                            throw "No assets have been loaded. Use loadSpritesheet() first";
                        }
                        var tex = []
                            ,i = 0
                            ;
                        // Populate our movieclip
                        for (i; i < options.frames.length; i++) {
                            texture = PIXI.Texture.fromFrame(options.frames[i]);
                            tex.push(texture);
                        }
                        view = new PIXI.MovieClip(tex);
                        if (options.anchor ) {
                            view.anchor.x = options.anchor.x;
                            view.anchor.y = options.anchor.y;
                        }
                        // If a container is specified, use add to that container
                        if (options.container) {
                            options.container.addChild(view);
                        } else {
                            // Otherwise just add the view to the stage
                            this.stage.addChild(view);
                        }
                        return view;
                    // Create a default case
                    default:
                        throw 'Invalid PIXI.DisplayObject passed';
                }
            },
    
            /**
             * PixiRenderer#centerAnchor( view )
             * - view (PIXI.DisplayObject): The view to center
             *
             * Centers the anchor to {x: 0.5, y: 0.5} of a view
             **/
            centerAnchor: function( view ) {
                if (view !== null){
                    view.anchor.x = 0.5;
                    view.anchor.y = 0.5;
                }
            }
        };
    });
}

