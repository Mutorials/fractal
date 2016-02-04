"use strict";

// Used for reading and inserting GLSL files via brfs transform.
var fs = require("fs");
var $ = require("jquery");

function getShader(gl, src, type) {
  var shader;
  if (type === gl.FRAGMENT_SHADER) shader = gl.createShader(gl.FRAGMENT_SHADER);
  else if (type === gl.VERTEX_SHADER) shader = gl.createShader(gl.VERTEX_SHADER);
  else return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === 0) {
    var errLog = gl.getShaderInfoLog(shader);
    console.error("WebGL: Error compiling shader:", errLog);
    throw new Error("WebGL: Error compiling shader:" + errLog);
  }
  return shader;
}


var fpsStat = $("#FPS");

//Re, Im, time-mul
var states = [
  [0.3, 0, 0.2],
  [0.2, 0, 0.2],
  [0.3, 0.05, 0.1],
  [0.5, 0.2, 0.05],
  [0.1, 0.6, 0.1],
  [-0.1, 0.8, 0.1],
  [-0.3, 0.2, 0.1],
  [-0.8, 0.3, 0.1],
  [-0.5, -0.3, 0.1],
  [-0.4, 0.0, 0.2],
  [0.3, 0, 0.15]
];

var gl, canvas;
var cUniformLoc,
  size,
  frameCount = 0,
  fpsTimer,
  timeMilliseconds,
  n = states.length - 2,
  state,
  stateMul = 30,
  endStateTime,
  timePause,
  inAnimation = true;


function getSize() {
  //maximum square
  return Math.min(window.innerWidth, window.innerHeight);
}

function draw() {
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

//change speed
function setSpeed(v) {
  stateMul = v.valueOf();
}


function anim() {
  var currentStateTime = new Date().getTime() / 1000;

  var phase = (endStateTime - currentStateTime) / (stateMul * states[state][2]);

  //interpolate states
  gl.uniform2f(cUniformLoc,
    states[state][0] * phase + states[state + 1][0] * (1 - phase),
    states[state][1] * phase + states[state + 1][1] * (1 - phase)
  );

  draw();

  if (currentStateTime > endStateTime) {
    state++;
    if (state > n) state = 0;
    endStateTime += states[state][2] * stateMul;
  }

  frameCount++;

  if (inAnimation) window.requestAnimationFrame(anim );
}



function toggle() {

  var seconds = new Date().getTime() / 1000;


  inAnimation = !inAnimation;

  if (inAnimation) {
    if (timePause > 0) {
      endStateTime += seconds - timePause;
      timePause = -1;
    }
    anim();
    $("#toggleBtn").text( "Stop");
  }
  else {
    timePause = seconds;
    $("#toggleBtn").text( "Run ");

  }




}

function updateFps() {
  var now = new Date().getTime();
  fpsStat.text(Math.round(1000 * frameCount / (now - timeMilliseconds)));
  frameCount = 0;
  timeMilliseconds = now;
}


function init() {

  window.console.log("Fractal app started");

  canvas = document.getElementById("canvas");

  size = getSize();

  canvas.width = canvas.height = size;

  if (!window.WebGLRenderingContext) {
    window.alert("Your browser does not support WebGL. See http://get.webgl.org");
    return;
  }
  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  } catch (e) {
    console.log("No webGL" + e);
  }

  if (!gl) {
    window.alert("Can't get WebGL");
    return;
  }

  gl.viewport(0, 0, size, size);

  var prog = gl.createProgram();

  gl.attachShader(prog,
    getShader(gl,
      fs.readFileSync(__dirname + "/glsl/julia.frag"),
      gl.FRAGMENT_SHADER
    ));
  gl.attachShader(prog,
    getShader(gl,
      fs.readFileSync(__dirname + "/glsl/vertex.vert"),
      gl.VERTEX_SHADER
    ));
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    var errLog = gl.getProgramInfoLog(prog);
    console.error("WebGL: Error linking shader program:", errLog);
    throw new Error("WebGL: Error linking shader program:" + errLog);
  }

  gl.useProgram(prog);

  var posAtrLoc = gl.getAttribLocation(prog, "vPos");
  gl.enableVertexAttribArray(posAtrLoc);

  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

  //simple quad
  var vertices = new Float32Array([
    -1, -1, 0,
    1, -1, 0,
    -1, 1, 0,
    1, 1, 0]);

  //buffer quad
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);


  gl.vertexAttribPointer(posAtrLoc, 3, gl.FLOAT, false, 0, 0);

  cUniformLoc = gl.getUniformLocation(prog, "c");

  gl.uniform2f(gl.getUniformLocation(prog, "scale"), size / 2, size / 3);

  timeMilliseconds = new Date().getTime();

  state = 0;
  timePause = -1;
  endStateTime = timeMilliseconds / 1000 + states[state][2] * stateMul;

  fpsTimer = setInterval(updateFps, 500);

  anim();

  window.resize = function () {
    canvas.width = canvas.height = getSize();

    gl.uniform2f(gl.getUniformLocation(prog, "scale"), size / 2, size / 3);

    gl.viewport(0, 0, size, size);

    draw();

  };

  $("#speedInput").bind("input", function () {
    setSpeed($(this).val());
  });

  $("#toggleBtn").click(function () {
    toggle();
  });

}

$(document).ready(init);
