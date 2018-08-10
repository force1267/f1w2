var dialog = require("electron").remote.dialog;

var ngn = require("./../engine/engine.js");
var tilesize = null;
var namesnum = 0;
var loaded_tiles = {
    tiles : []
}
var loaded_tiles_elements = [];
var tiles = {
    all : []
}


var map = document.getElementById("canvas");
var ctx = map.getContext("2d");
map.style.position = "absolute";
map.style.top = "0%";
map.style.left = "0%";
map.style.width = "80%";
map.style.height = "80%";
map.oncontextmenu = function (e) {
    e.preventDefault();
};

var tiles_panel = document.getElementById("tiles");
tiles_panel.style.position = "absolute";
tiles_panel.style.top = "0%";
tiles_panel.style.left = "80%";
tiles_panel.style.width = "20%";
tiles_panel.style.height = "80%";
tiles_panel.style.backgroundColor = "rgba(0,100,100,75)";

var tools = document.getElementById("tools");
tools.style.position = "absolute";
tools.style.top = "80%";
tools.style.left = "0%";
tools.style.width = "100%";
tools.style.height = "20%";
tools.style.backgroundColor = "rgba(100,0,100,75)";

document.getElementById("tilesizeinit").onclick = function(){
    //find and set global tilesize
    var tsvalue = document.getElementById("tilesize").value
    tilesize = tsvalue ? parseInt(tsvalue) : 32;//defaults to 32

    ngn.init({
        TILE_SIZE : tilesize,
        WIDTH : tilesize * 25,
        HEIGHT : tilesize * 25,
        CANVAS : map,
    })
    //acvtivate tile load button
    var ldtile = document.getElementById("load-tile")
    ldtile.disabled = false;
    ldtile.onclick = function load_tile(){
        ldtile.disabled = true;
        ldtile.value = "done";
        //load a tileset image and render it
        var img = null, img_is_loaded = false;
        dialog.showOpenDialog(function(names){
            for(var n of names){
                img = new Image;
                img.src = n;
                img.onload = function(){
                    ctx.drawImage(img, 0, 0);
                    img_is_loaded = true;
                    ldtile.disabled = false;
                }
            }
        })
        map.style.cursor = "pointer";
        //choose tiles from rendered image
        map.onmousemove = function(e){
            var x = Math.floor((e.clientX * (map.width / map.offsetWidth)) / tilesize);
            var y = Math.floor((e.clientY * (map.height / map.offsetHeight)) / tilesize);
            ctx.clearRect(0, 0, map.width, map.height);
            if(img_is_loaded){
                ctx.drawImage(img, 0, 0);
            }
            ctx.fillStyle = "blue";
            ctx.globalAlpha = 0.3;
            for(var t of tiles.all){
                if(t){
                    ctx.fillRect(t.x*tilesize, t.y*tilesize, tilesize, tilesize);
                }
            }
            ctx.fillRect(x*tilesize, y*tilesize, tilesize, tilesize);
            ctx.globalAlpha = 1;
        }
        map.onclick = function(e){
            var x = Math.floor((e.clientX * (map.width / map.offsetWidth)) / tilesize);
            var y = Math.floor((e.clientY * (map.height / map.offsetHeight)) / tilesize);
            var selected = false;
            tiles.all.forEach( 
                (t, i) => {
                    if(t && t.x === x && t.y === y){
                        tiles.all[i] = null;
                        selected = true;
                    }
                }
            )
            if(!selected){
                tiles.all.push({x, y});
            }
        }
        //add tiles to tiles panel
        ldtile.onclick = function(){
            ldtile.value = "load";
            ldtile.onclick = load_tile;
            map.onclick = map.onmousemove = function(){}
            ctx.clearRect(0, 0, map.width, map.height);
            ctx.drawImage(img, 0, 0);
            ctx.fillStyle = "black";
            ctx.globalAlpha = 1;
            tiles.all.forEach( 
                (t, i) => { 
                    if(t){
                        loaded_tiles.tiles.push([namesnum++, img.src, t.x*tilesize, t.y*tilesize]);
                        var tl = document.createElement("canvas");
                        tl.width = tl.height = tilesize;
                        tl.style.margin = "3px"
                        var tlctx = tl.getContext("2d");
                        var imgdata = ctx.getImageData(t.x*tilesize, t.y*tilesize, tilesize, tilesize);
                        tlctx.putImageData(imgdata, 0, 0);
                        tiles_panel.appendChild(tl);
                        loaded_tiles_elements.push(tl);
                    }
                }
            )
            tiles.all = [];
        }
    }
}