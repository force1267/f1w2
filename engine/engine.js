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
        RENDER_DISTANCE_X = 1600;
        RENDER_DISTANCE_Y = 900;
        WORLD_WIDTH = 20000,
        WORLD_HEIGHT = 20000,
        WORLD_PART_SIZE = 500
        CANVAS = null
        CONTEXT2D = null;

    function init(config){
        FPS = config.FPS ? config.FPS : FPS
        TPS = config.TPS ? config.TPS : TPS
        WIDTH = config.WIDTH ? config.WIDTH : WIDTH
        HEIGHT = config.HEIGHT ? config.HEIGHT : HEIGHT
        WORLD_WIDTH = config.WORLD_WIDTH ? config.WORLD_WIDTH : WORLD_WIDTH
        WORLD_HEIGHT = config.WORLD_HEIGHT ? config.WORLD_HEIGHT : WORLD_HEIGHT
        if(config.CANVAS){
            var canvas = CANVAS = config.CANVAS
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            CONTEXT2D = canvas.getContext("2d");
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
        setTimeout(update, 1000/TPS);
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

    function render(camera){
        camera.ctx.fillStyle = "white"
        camera.ctx.fillRect(0, 0, WIDTH, HEIGHT);
        camera.follow();
        for(var object of camera.all){
            if(object.type !== "logic"){
                var x = object.x - camera.x;
                var y = object.y - camera.y;
                object.draw(camera.ctx, x, y);
            }
        }
        setTimeout(()=>render(camera), 1000/FPS);
    }

    window.__ngn = {
        world,
        update,
        render,
        agent,
        camera,
        init
    };
    return __ngn;
})();