var { init, agent, world, camera, update, render } = require("./../engine/engine.js");
var { map, tiles, tools } = getPage();






function getPage(){
    var map = document.getElementById("canvas");
    map.style.position = "absolute";
    map.style.top = "0%";
    map.style.left = "0%";
    map.style.width = "80%";
    map.style.height = "80%";
    map.oncontextmenu = function (e) {
        e.preventDefault();
    };
    
    var tiles = document.getElementById("tiles");
    tiles.style.position = "absolute";
    tiles.style.top = "0%";
    tiles.style.left = "80%";
    tiles.style.width = "20%";
    tiles.style.height = "80%";
    tiles.style.backgroundColor = "green";

    var tools = document.getElementById("tools");
    tools.style.position = "absolute";
    tools.style.top = "80%";
    tools.style.left = "0%";
    tools.style.width = "100%";
    tools.style.height = "20%";
    tools.style.backgroundColor = "purple";

    return { map, tiles, tools };
}