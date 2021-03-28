"use strict";

// webgl related
let gl;
let programFirefly;
let cBufferFirefly;
let vBufferFirefly;
let colorLocFirefly;
let positionLocFirefly;
let transposeFireflyLoc;

const positionsFirefly = [];
const colorsFirefly = [];
const translationFirefly = [];
const rotationFirefly = [];

// config related
let numFirefly = 5;


//
// tool functions
//

// compute homogeneous transpose matrix
// (vec3(roll, pitch, yaw), vec3(x, y, z)) => mat4
function getTransposeMat(tempRotation, tempTranslation) {
	const zMat = rotateZ(tempRotation[2]);
	const yMat = rotateY(tempRotation[1]);
	const xMat = rotateX(tempRotation[0]);
	const tMat = translate(tempTranslation[0], tempTranslation[1], tempTranslation[2]);
	return mult(tMat, mult(xMat, mult(yMat, zMat)));
};


//
// modeling functions
//

// construct firefly model // TODO: modeling
// float(0, 0.5] => void
function getFireflyModel(sizeFirefly) {
	positionsFirefly.length = 0;
	colorsFirefly.length = 0;

	// body
	const bodyPosition = [[
			vec3(0, 0, 0),
			vec3(-sizeFirefly, -sizeFirefly * Math.sqrt(3) / 3, -sizeFirefly * Math.sqrt(3)),
			vec3(sizeFirefly, -sizeFirefly * Math.sqrt(3) / 3, -sizeFirefly * Math.sqrt(3)),
			vec3(0, sizeFirefly * 2 * Math.sqrt(3) / 3, -sizeFirefly * Math.sqrt(3))
			],[
			vec3(0, 0, 0),
			vec3(sizeFirefly, sizeFirefly * Math.sqrt(3) / 3, sizeFirefly * Math.sqrt(3)),
			vec3(-sizeFirefly, sizeFirefly * Math.sqrt(3) / 3, sizeFirefly * Math.sqrt(3)),
			vec3(0, -sizeFirefly * 2 * Math.sqrt(3) / 3, sizeFirefly * Math.sqrt(3))
			]
		];

	const bodyColor = [vec3(0.2, 0.2, 0.2), vec3(0.8, 0.8, 0.8)];


	positionsFirefly.push(
		bodyPosition[0][0], bodyPosition[0][1], bodyPosition[0][2],
		bodyPosition[0][0], bodyPosition[0][2], bodyPosition[0][3],
		bodyPosition[0][0], bodyPosition[0][3], bodyPosition[0][1],
		bodyPosition[0][3], bodyPosition[0][2], bodyPosition[0][1],

		bodyPosition[1][0], bodyPosition[1][1], bodyPosition[1][2],
		bodyPosition[1][0], bodyPosition[1][2], bodyPosition[1][3],
		bodyPosition[1][0], bodyPosition[1][3], bodyPosition[1][1],
		bodyPosition[1][3], bodyPosition[1][2], bodyPosition[1][1]
		);

	colorsFirefly.push(
		bodyColor[0], bodyColor[0], bodyColor[0],
		bodyColor[0], bodyColor[0], bodyColor[0],
		bodyColor[0], bodyColor[0], bodyColor[0],
		bodyColor[0], bodyColor[0], bodyColor[0],

		bodyColor[1], bodyColor[1], bodyColor[1],
		bodyColor[1], bodyColor[1], bodyColor[1],
		bodyColor[1], bodyColor[1], bodyColor[1],
		bodyColor[1], bodyColor[1], bodyColor[1]
		);

	return;
};


//
// init functions
//

// construct fireflies
// void => void
function buildFirefly() {
	// firefly model
	const sizeFirefly = 0.04;
	getFireflyModel(sizeFirefly);

	// firefly transpose
	translationFirefly.length = 0;
	rotationFirefly.length = 0;
	numFirefly = document.getElementById("numFirefly").value;
	let tempNumFirefly = 0;
	// translation
	while (tempNumFirefly < numFirefly) {
		const tempTranslationFirefly = vec3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
		//TODO: collision detection, out of boundary detection
		translationFirefly.push(tempTranslationFirefly);
		tempNumFirefly ++;
	};
	//rotation
	for (let i = 0; i < numFirefly; i ++) {
		const tempYaw = Math.random() * 360;
		const tempPitch = Math.random() * 180 - 90;
		const tempRow = Math.random() * 180 - 90;
		rotationFirefly.push(vec3(tempRow, tempPitch, tempYaw))
	};
	return
}

// init shaders, bind buffers and send models
// void => void
function initDrawing() {
	//  Load shaders and initialize attribute buffers

	programFirefly = initShaders(gl, "firefly-vertex-shader", "firefly-fragment-shader");

	// Load the data into the GPU

	// firefly
	gl.useProgram(programFirefly);

	cBufferFirefly = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBufferFirefly);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsFirefly), gl.STATIC_DRAW);

	colorLocFirefly = gl.getAttribLocation(programFirefly, "aColorFirefly");
	gl.enableVertexAttribArray(colorLocFirefly);

	vBufferFirefly = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBufferFirefly);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsFirefly), gl.STATIC_DRAW);

	positionLocFirefly = gl.getAttribLocation(programFirefly, "aPositionFirefly");
	gl.enableVertexAttribArray(positionLocFirefly);

	transposeFireflyLoc = gl.getUniformLocation(programFirefly, "transposeFirefly");

	render();
	return;
};

// reset drawing. response to button "Reset!"
// void => void
function buildAllDrawAll() {
	buildFirefly();
	//TODO: glowing
	initDrawing();
	return;
};


// init the whole program
// void => void
window.onload = function init() {
	const canvas = document.getElementById("gl-canvas");
	gl = canvas.getContext('webgl2');
	if (!gl) alert( "WebGL 2.0 isn't available" );

	//
	//  Configure WebGL
	//
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	buildAllDrawAll();
	return;
};

//
// rendering function
//

// call webgl to draw a new frame
// void => void
function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// draw fireflies
	for (let i = 0; i < numFirefly; i ++) {
		//for each firefly, use firefly model
		gl.useProgram(programFirefly);
		gl.bindBuffer(gl.ARRAY_BUFFER, cBufferFirefly);
		gl.vertexAttribPointer(colorLocFirefly, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, vBufferFirefly);
		gl.vertexAttribPointer(positionLocFirefly, 3, gl.FLOAT, false, 0, 0);

		//compute transpose matrix as uniform variable
		const transposeMat = getTransposeMat(rotationFirefly[i], translationFirefly[i])
		gl.uniformMatrix4fv(transposeFireflyLoc, false, flatten(transposeMat));
		gl.drawArrays(gl.TRIANGLES, 0, positionsFirefly.length);
	};

	// TODO: firefly moving
};

