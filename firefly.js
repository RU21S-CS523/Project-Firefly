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
const frameSpeedMS = 33;

//
// tool functions
//

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }


// compute homogeneous rotation matrix
// vec3(roll, pitch, yaw) => mat4
function getRotationMat(tempRotation) {
	const zMat = rotateZ(tempRotation[2]);
	const yMat = rotateY(tempRotation[1]);
	const xMat = rotateX(tempRotation[0]);
	return mult(xMat, mult(yMat, zMat));
}

// compute homogeneous transpose matrix
// (vec3(roll, pitch, yaw), vec3(x, y, z)) => mat4
function getTransposeMat(tempRotation, tempTranslation) {
	const tMat = translate(tempTranslation[0], tempTranslation[1], tempTranslation[2]);
	const rMat = getRotationMat(tempRotation)
	return mult(tMat, rMat);
};

// add a random rotation to tempRotation
// (vec3(roll, pitch, yaw), float(0, 45)) => vec3(roll, pitch, yaw)
function randomRotate(tempRotation, rotationSpeed) {
	let [tempRow, tempPitch, tempYaw] = tempRotation;
	const rotationSpeed2 = rotationSpeed * 2;
	tempRow = (tempRow + 450 + Math.random() * rotationSpeed2 - rotationSpeed) % 360 - 90;
	tempPitch = (tempPitch + 450 + Math.random() * rotationSpeed2 - rotationSpeed) % 360 - 90;
	tempYaw = (tempYaw + 360 + Math.random() * rotationSpeed2 - rotationSpeed) % 360;
	return vec3(tempRow, tempPitch, tempYaw);
};

// add a random translation to tempTranslation, given tempRotation
// (vec3(x, y, z), vec3(roll, pitch, yaw), float(0, 0.1)) => vec3(x, y, z)
function randomTranslate(tempTranslation, tempRotation, translationSpeed) {
	const rMat = getRotationMat(tempRotation);
	const unitVec = vec4(0, 0, translationSpeed, 0); // becasue the model of firefly is heading to z+
	const rotatedUniVec = mult(rMat, unitVec);
	const translationDiff = vec3(rotatedUniVec[0], rotatedUniVec[1], rotatedUniVec[2]);
	return add(tempTranslation, translationDiff);
}


//
// modeling functions
//

// construct firefly model // TODO: modeling
// float(0, 0.5] => void
function getFireflyModel(sizeFirefly) {
	positionsFirefly.length = 0;
	colorsFirefly.length = 0;

	// body //heading to z+
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
// moving functions
//

// update rotationFirefly
// void => void
function updateFireflyRotation() {
	rotationFirefly.forEach((tempRotation, idx) => rotationFirefly[idx] = randomRotate(tempRotation, 1));
	return;
};

// update translationFirefly
// void => void
function updateFireflyTranslation() {
	translationFirefly.forEach((tempTranslation, idx) => {
		const nextTranslation = randomTranslate(tempTranslation, rotationFirefly[idx], 0.002);
		//collision and boundary detection
		translationFirefly[idx] = nextTranslation;
	});
	return;
};

// update transpose iteratively
// void => void
function updateFireflyTranspose() {
	updateFireflyRotation();
	updateFireflyTranslation();
	setTimeout(updateFireflyTranspose, frameSpeedMS); //update here to avoid frame rate influence
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
	const fireflyTranslationHalfRange = 1 - sizeFirefly;
	const fireflyTranslationRange = 2 * fireflyTranslationHalfRange;
	while (tempNumFirefly < numFirefly) {
		const tempTranslationFirefly = vec3(
			Math.random() * fireflyTranslationRange - fireflyTranslationHalfRange,
			Math.random() * fireflyTranslationRange - fireflyTranslationHalfRange,
			Math.random() * fireflyTranslationRange - fireflyTranslationHalfRange
			);
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

	updateFireflyTranspose();
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
	canvas.width = window.innerWidth - 100;
	canvas.height = window.innerHeight - 100;
	const viewSize = Math.min(canvas.width, canvas.height);
	// const viewXPos = canvas.width - viewSize; // no need, because it should be left-aligned
	const viewYPos = canvas.height - viewSize;

	gl = canvas.getContext('webgl2');
	if (!gl) alert( "WebGL 2.0 isn't available" );

	//
	//  Configure WebGL
	//
	gl.viewport(0, viewYPos, viewSize, viewSize);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

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
	setTimeout(() => {
		requestAnimationFrame(render);

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
	}, frameSpeedMS);
};

