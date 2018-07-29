module.exports = (()=>{

    const P = Math.PI;
    Array.prototype.pushFill = function(element){
        for(var i = 0; i <= this.length; i++){
            if(this[i] === undefined || this[i] === null){
                this[i] = element;
                return i;
            }
        }
    }
    Array.prototype.pushOnce = function(element){
        for(var i in this){
            if(this[i] === element){
                return i;
            }
        }
        return parseInt(this.pushFill(element));
    }
    Array.prototype.remove = function(element){
        for(var i in this){
            if(this[i] === element){
                this[i] = null;
            }
        }
    }

    var FPS = 60,
        TPS = 128,
        NET = 20,
        WIDTH = 1600,
        HEIGHT = 900,
        RENDER_DISTANCE_X = 1600,
        RENDER_DISTANCE_Y = 900,
        TILE_SIZE = 32,
        WORLD_WIDTH = 4000,
        WORLD_HEIGHT = 4000,
        WORLD_PART_SIZE = 400,
        CANVAS = null,
        CONTEXT2D = null;

    function init(config){
        FPS = config.FPS ? config.FPS : FPS
        TPS = config.TPS ? config.TPS : TPS
        WIDTH = config.WIDTH ? config.WIDTH : WIDTH
        HEIGHT = config.HEIGHT ? config.HEIGHT : HEIGHT
        RENDER_DISTANCE_X = config.RENDER_DISTANCE_X ? config.RENDER_DISTANCE_X : WIDTH
        RENDER_DISTANCE_Y = config.RENDER_DISTANCE_Y ? config.RENDER_DISTANCE_Y : HEIGHT
        WORLD_WIDTH = config.WORLD_WIDTH ? config.WORLD_WIDTH : WORLD_WIDTH
        WORLD_HEIGHT = config.WORLD_HEIGHT ? config.WORLD_HEIGHT : WORLD_HEIGHT
        TILE_SIZE = config.TILE_SIZE ? config.TILE_SIZE : TILE_SIZE;
        tiles.all = config.TILES ? config.tiles : [];
        tiles.x = Math.ceil(WORLD_WIDTH / TILE_SIZE);
        tiles.y = Math.ceil(WORLD_HEIGHT / TILE_SIZE);
        if(config.CANVAS){
            var canvas = CANVAS = config.CANVAS
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            CONTEXT2D = canvas.getContext("2d");
        }
    }

    var paused = false;
    function pause(time){
        paused = true;
        if(time !== undefined){
            setTimeout(
                ()=>paused=false,
                time
            );
        }
    }
    function resume(fn){
        paused = false;
        if(fn instanceof Array){
            fn.forEach(e=>e())
        } else {
            fn()
        }
    }

    var world = {
        all : []
    }
    world.part = [];
    for(var i = -1; i <= Math.floor(WORLD_WIDTH / WORLD_PART_SIZE); i++ ){
        world.part[i] = [];
        for(var j = -1; j <= Math.floor(WORLD_HEIGHT / WORLD_PART_SIZE); j++){
            world.part[i][j] = [];
        }
    }
    world.add = function(obj){
        var i = Math.floor(obj.x/WORLD_PART_SIZE);
        var j = Math.floor(obj.y/WORLD_PART_SIZE);
        if(world.part[i] && world.part[i][j]){
            world.part[i][j].pushOnce(obj);
        }
        obj.__world.i = i;
        obj.__world.j = j;
        world.all.pushOnce(obj);
    }
    world.move = function(obj){
        if(world.part[obj.__world.i] && world.part[obj.__world.i][obj.__world.j]){
            world.part[obj.__world.i][obj.__world.j].remove(obj);
        }
        var i = Math.floor(obj.x/WORLD_PART_SIZE);
        var j = Math.floor(obj.y/WORLD_PART_SIZE);
        if(world.part[i] && world.part[i][j]){
            world.part[i][j].pushOnce(obj);
        }
        obj.__world.i = i;
        obj.__world.j = j;
    }

    var agentUIDGeneratorCounter = 0;
    function agentUIDGenerator(){
        return agentUIDGeneratorCounter ++;
    }
    class agent {
        //types : logic solid destroyable active
        constructor(x = 0, y = 0,w = WORLD_PART_SIZE/5, h = WORLD_PART_SIZE/5, type = "solid", id){
            this.__uid = id ? id : agentUIDGenerator()
            this.type = type;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.previousx = x;
            this.previousy = y;
            this.speed = 0;
            this.direction = P/4;
            this.__world = {};
        }
        update(){
            this.moveBySpeed();
            world.move(this);
        }
        moveBySpeed(){
            this.previousx = this.x;
            this.previousy = this.y;
            this.x += (this.speed / TPS) * Math.sin(this.direction);
            this.y += (this.speed / TPS) * Math.cos(this.direction);
        }
        draw(ctx, x, y){
            ctx.fillStyle = "green";
            ctx.fillRect(x, y, this.w, this.h);
        }
    }

    function update(){
        for(object of world.all){
            if(object.type === "active" || object.type === "logic"){
                object.update();
            }
        }
        if(!paused){
            setTimeout(update, 1000/TPS);
        }
    }

    //points : Array[ function(data) ]
    // function sync(point){

    //     setTimeout(sync, 1000/NET);
    // }

    class camera {
        constructor(following){
            this.following = following;
            this.x = this.follow ? this.follow.x + WIDTH/2 : 0;
            this.y = this.follow ? this.follow.y + HEIGHT/2 : 0;
            this.ctx = CONTEXT2D;
            this.all = [];
            this.rdx = Math.ceil((RENDER_DISTANCE_X/2)/WORLD_PART_SIZE);
            this.rdy = Math.ceil((RENDER_DISTANCE_Y/2)/WORLD_PART_SIZE);
            this.tsx = Math.ceil(RENDER_DISTANCE_X / TILE_SIZE);
            this.tsy = Math.ceil(RENDER_DISTANCE_Y / TILE_SIZE);
        }
        follow(ag){
            if(ag){
                this.following = ag;
            }
            this.x = this.following.x - RENDER_DISTANCE_X/2;
            this.y = this.following.y - RENDER_DISTANCE_Y/2;
            this.all = [];
            var i = this.following.__world.i;
            var j = this.following.__world.j;
            var rdx = this.rdx;
            var rdy = this.rdy;
            for(var ii = -rdx; ii <= rdx; ii++){
                for(var jj = -rdy; jj <= rdy; jj++){
                    for(var e of world.part[i+ii][j+jj]){
                        this.all.pushOnce(e);
                    }
                }
            }
        }
    }

    var image_sources = [];
    var tile_templates = {};
    class TileTemplate {
        constructor(name, src, sx, sy){
            this.name = name;
            this.src = src;
            tile_templates[name] = this;
            var self = this;
            var imgdata = null;
            //find previously loaded image
            for(var s of image_sources){
                if(s.src === src){
                    imgdata = s.cvs.getContext("2d").getImageData(sx, sy, TILE_SIZE, TILE_SIZE);
                }
            }
            if(imgdata === null){
                //load image
                var img = new Image;
                img.src = src;
                img.onload = function(){
                    var cvs = document.createElement("canvas");
                    image_sources.push({src,cvs});
                    self.data = cvs.getContext("2d").getImageData(sx, sy, TILE_SIZE, TILE_SIZE);
                }
            } else {
                self.data = imgdata;
            }
        }
        draw(ctx, x, y){
            ctx.putImageData(this.data, x, y);
        }
    }

    //load the map
    function load_tiles(tile_list){
        // tile_list = {
        //     tiles : [  ["grass", "tileset.png", 64, 256], ... ]
        //     locs : [  ["grass", 12, 17], ... ]
        // }
        JSON.parse(tile_list).tiles.forEach(
            t => new TileTemplate(t[0],t[1],t[2],t[3])
        );
        JSON.parse(tile_list).locs.forEach(
            l => {
                tiles.all[l[1]][l[2]] = l[0];
            }
        );
    }

    var tiles = {
        all : [],
        x : 0,
        y : 0
    }
    
    var savedCamera = null;//so we can resume(render) instead of resume(()=>render(cam))
    function render(camera = savedCamera){
        savedCamera = camera;//prpbably not a good idea
        camera.ctx.fillStyle = "white"
        camera.ctx.fillRect(0, 0, WIDTH, HEIGHT);
        camera.follow();

        //render tiles
        var sx = Math.floor(camera.x/TILE_SIZE);
        var sy = Math.floor(camera.y/TILE_SIZE);
        var xs = camera.tsx;
        var ys = camera.tsy;
        for(var i = sx; i < sx + xs; i++){
            if(tiles.all[i]){
                for(var j = sy; j < sy + ys; j++){
                    if(tiles.all[i][j]){
                        tile_templates[ tiles.all[i][j] ].draw(camera.ctx, i*TILE_SIZE, j*TILE_SIZE);
                    }
                }
            }
        }

        //render objects inside camera
        for(var object of camera.all){
            if(object.type !== "logic"){
                var x = object.x - camera.x;
                var y = object.y - camera.y;
                object.draw(camera.ctx, x, y);
            }
        }
        if(!paused){
            setTimeout(()=>render(camera), 1000/FPS);
        }
    }

    function input(){
        var exports = {};
        //player inputs
        exports.key = {
            //mouse
        mouse_left : 0, mouse_right : 2,
            //keyboard
        num_0 : 48, num_1 : 49, num_2 : 50, num_3 : 51, num_4 : 52, num_5 : 53, num_6 : 54,
        num_7 : 55, num_8 : 56, num_9 : 57, a : 65, add : 107, alt : 18, b : 66,
        backspace : 8, c : 67, ctrl : 17, d : 68, decimal : 110, delete : 46,
        divide : 111, down : 40, e : 69, end : 35, enter : 13, escape : 27,
        f1 : 112, f2 : 113, f3 : 114, f4 : 115, f5 : 116, f6 : 117,
        f7 : 118, f8 : 119, f9 : 120, f10 : 121, f11 : 122, f12 : 123,
        g : 71, h : 72, home : 36, f : 70, i : 73, insert : 45, j : 74, k : 75,
        l : 76, left : 37, m : 77, multiply : 106, n : 78, cal_0 : 96, cal_1 : 97,
        cal_2 : 98, cal_3 : 99, cal_4 : 100, cal_5 : 101, cal_6 : 102, cal_7 : 103,
        cal_8 : 104, cal_9 : 105, o : 79, p : 80, pagedown : 34, pageup : 33,
        pause : 19, q : 81, r : 82, right : 39, s : 83, shift : 16, space : 32,
        subtract : 109, t : 84, tab : 9, u : 85, up : 38, v : 86, w : 87,
        x : 88, y : 89, z : 90 }
    
        // keyboard functions:
        exports.keyboard_register = function(){
        var KR = exports.KR = {}
            KR.key_down = [];
            KR.key_press = [];
            KR.key_up = [];
            for(var k in exports.key){
                KR.key_up[exports.key[k]] = 1;
            }
            return KR;
        }
        exports.localKeyboard = new exports.keyboard_register();//local keyboard
        var LK = exports.localKeyboard;
    
        exports.key_check_down = function(_key,kr) { return kr === undefined ? LK.key_down[_key] : kr.key_down[_key]; }
        exports.key_check_press = function(_key,kr) { return kr === undefined ? LK.key_press[_key] : kr.key_press[_key]; }
        exports.key_check_up = function(_key,kr) { return kr === undefined ? LK.key_up[_key] : kr.key_up[_key]; }
        exports.key_on_change = function(_key){}// set a handler
        var bd = CANVAS;
        bd.addEventListener("keydown", function(event){
            LK.key_down[event.keyCode] = 1;
            LK.key_up[event.keyCode] = 0;
            exports.key_on_change(event.keyCode);
        });
        bd.addEventListener("keypress", function(event){//event.keyCode is for upper case (works here if capslock is on)
            LK.key_press[event.keyCode] = 1;
        });
        bd.addEventListener("keyup", function(event){
            LK.key_up[event.keyCode] = 1;
            LK.key_down[event.keyCode] = 0;//key must come up ! otherwise it's still down !!!
            exports.key_on_change(event.keyCode);
        });
        // mouse functions:
        bd.addEventListener("mousedown", function(event){
            LK.key_down[event.button] = 1;
            LK.key_up[event.button] = 0;
            LK.key_press[event.button] = 1;//not good !
        });
        bd.addEventListener("mouseup", function(event){
            LK.key_up[event.button] = 1;
            LK.key_down[event.button] = 0;
            LK.key_press[event.button] = 0;//not good !
        });

        return exports;
    }


    window.__ngn = {
        world,
        update,
        tiles,
        render,
        TileTemplate,
        load_tiles,
        pause,
        resume,
        agent,
        camera,
        init,
        input
    };
    return __ngn;
})();