var { init, agent, world, camera, update, render } = require("./../../engine/engine.js");
var canvas = document.getElementById("canvas");
canvas.style.position = "absolute";
canvas.style.top = "3%";
canvas.style.left = "3%";
canvas.style.width = "97%";
canvas.style.height = "97%";
canvas.oncontextmenu = function (e) {
    e.preventDefault();
};

init({
    CANVAS: canvas,
    WIDTH: 1600,
    HEIGHT: 900
})

var p = new agent(1200,1200,100,100,"active",101);
var s = new agent(1350,1300,50,50,"solid",102);

window.ppp = p;
window.sss = s;

world.add(p);
world.add(s);

var cam = new camera(p);


update();
render(cam);