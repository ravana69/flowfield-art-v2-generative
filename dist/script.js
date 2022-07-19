console.clear();

const GUI = new dat.GUI();

const types = ["full", "circle", "heart"];
const shapes = ["circle", "square", "triangle", "heart", "star", "random"];
const colorConfigs = ["whiteOnBlack", "blackOnWhite"];

let settings = {
	type: types[0],
	shape: shapes[2],
	colorConfig: colorConfigs[0],
	texts: "",
	totalNumberOfParticles: 360,
	scale: 40,
	zOffsetIncrement: 0.001,
	radius: {
		default: 80,
		min: 20,
		max: 100
	},
	stroke_color_default: true,
	colorize_stroke: false,
	strokeColor: "#ff0000",
	noFill: false,
	randomRadius: false,
	redraw: () => {
		resetAndInit();
	},
	save: () => {
		saveCanvas(canvas);
	}
};

let colorConfig = {
	background: "rgb(0,0,0)",
	stroke: "#fff",
	fill: "rgb(0,0,0)"
};

let cols,
	scale,
	rows,
	particles = [],
	flowFields;

let canvas;

function setup() {
	canvas = createCanvas(innerWidth, innerHeight);
	resetAndInit();
}

function init() {
	scale = settings.scale;
	cols = floor(width / scale) + 2;
	rows = floor(height / scale) + 2;
	flowFields = new Array(cols * rows);

	for (let i = 0; i < settings.totalNumberOfParticles; i++) {
		let x, y, radius;

		if (settings.type === "full") {
			x = random(width);
			y = random(height);
		} else if (settings.type === "circle") {
			x = Math.cos(i) * 100 + width / 2;
			y = Math.sin(i) * 100 + height / 2;
		} else if (settings.type === "heart") {
			let r = 15;
			x = r * 16 * pow(sin(i), 3) + width / 2;
			y =
				-r * (13 * cos(i) - 5 * cos(2 * i) - 2 * cos(3 * i) - cos(4 * i)) +
				height / 2;
		}

		if (settings.randomRadius) {
			radius = floor(random(settings.radius.min, settings.radius.max));
		} else {
			radius = settings.radius.default;
		}

		let stroke, shape;
		shape = settings.shape;
		if (shape === "random") shape = shapes[floor(random(shapes.length))];

		if (settings.stroke_color_default) {
			stroke = colorConfig.stroke;
		}
		if (settings.colorize_stroke) {
			stroke = `${settings.strokeColor}`;
		}

		particles.push(
			new Particle({
				position: createVector(x, y),
				radius,
				shape: settings.texts.length === 0 ? shape : "text",
				texts: settings.texts,
				fill: settings.noFill == true ? null : colorConfig.fill,
				stroke
			})
		);
	}
}

let increment = 0.1,
	start = 0,
	zoffset = 0;

function draw() {
	let xoffset = start;
	for (let x = 0; x < cols; x++) {
		let yoffset = start;
		for (let y = 0; y < rows; y++) {
			let index = x + y * cols;
			let angle = noise(xoffset, yoffset, zoffset) * TWO_PI * 2;
			let vector = p5.Vector.fromAngle(angle);
			flowFields[index] = vector;
			vector.setMag(1);
			yoffset += increment;
		}
		xoffset += increment;
		zoffset += settings.zOffsetIncrement;
	}

	particles.forEach((particle) => {
		particle.update();
		particle.follow(flowFields);
		particle.draw();
	});
}

function windowResized() {
	resizeCanvas(innerWidth, innerHeight);
	resetAndInit();
}

function resetCanvas() {
	background(`${colorConfig.background}`);
	particles = [];
}

function resetAndInit() {
	resetCanvas();
	checkColorConfig();
	init();
}

function checkColorConfig() {
	if (settings.colorConfig === "whiteOnBlack") {
		colorConfig.background = "rgb(0,0,0)";
		colorConfig.fill = "rgb(0,0,0)";
		colorConfig.stroke = "#fff";
	} else if (settings.colorConfig === "blackOnWhite") {
		colorConfig.background = "rgb(255,255,255)";
		colorConfig.fill = "rgb(255,255,255)";
		colorConfig.stroke = "#000";
	}
	background(`${colorConfig.background}`);
}

// All dat.GUI Code ----------

GUI.add(settings, "type", types).name("Types").onChange(resetAndInit);

GUI.add(settings, "shape", shapes).name("Shape").onChange(resetAndInit);

GUI.add(settings, "colorConfig", colorConfigs)
	.name("Color Config")
	.onChange(resetAndInit);

GUI.add(settings, "texts").name("texts").onChange(resetAndInit);

GUI.add(settings, "totalNumberOfParticles", 10, 360 * 2)
	.name("Particles")
	.onChange(resetAndInit);

GUI.add(settings, "scale", 10, 50).name("Scale").onChange(resetAndInit);

GUI.add(settings, "zOffsetIncrement", 0, 0.1)
	.name("Z-Offset")
	.onChange(resetAndInit);

GUI.add(settings.radius, "default", settings.radius.min, settings.radius.max)
	.step(10)
	.name("Radius")
	.onChange(resetAndInit);

let strokeColorFolder = GUI.addFolder("Stroke Color");
strokeColorFolder
	.addColor(settings, "strokeColor")
	.name("color")
	.onChange(resetAndInit);
let limitedPropsList = ["stroke_color_default", "colorize_stroke"];
addCheckbox(
	strokeColorFolder,
	settings,
	"stroke_color_default",
	"Default",
	limitedPropsList
);
addCheckbox(
	strokeColorFolder,
	settings,
	"colorize_stroke",
	"Color Stroke",
	limitedPropsList
);

GUI.add(settings, "noFill").name("No Fill").onChange(resetAndInit);

GUI.add(settings, "randomRadius").name("Random Radius").onChange(resetAndInit);

GUI.add(settings, "redraw").name("RE-DRAW");
GUI.add(settings, "save").name("SAVE");

class Particle {
	constructor(options = {}) {
		this.position = options.position;
		this.velocity = createVector(0, 0);
		this.acceleration = createVector(0, 0);
		this.maxspeed = 3;
		this.radius = options.radius;
		this.radiusDecrement = 1;
		this.shape = options.shape;
		this.fill = options.fill;
		this.stroke = options.stroke;
		this.rotation = 0;
		this.timer = 0;
		this.text = options.texts[floor(random(options.texts.length))];
	}

	draw() {
		if (!this.radius <= 0) {
			strokeWeight(0.5);
			this.applyStroke(this.stroke);
			if (this.fill != null) {
				fill(`${this.fill}`);
			} else {
				noFill();
			}

			push();
			translate(this.position.x, this.position.y);
			rotate(this.rotation);
			this.drawShape(this.shape);
			pop();

			this.radius -= this.radiusDecrement;
		}
	}

	drawShape(shape = "circle") {
		if (shape === "circle") {
			ellipse(0, 0, this.radius);
		} else if (shape === "square") {
			rectMode(CENTER);
			rect(0, 0, this.radius, this.radius);
		} else if (shape === "triangle") {
			const h = this.radius * (Math.sqrt(3) / 2);
			triangle(0, -h / 2, -this.radius / 2, h / 2, this.radius / 2, h / 2);
		} else if (shape === "heart") {
			beginShape();
			for (let i = 0; i < TWO_PI; i += 0.25) {
				const r = this.radius / 25;
				const x = r * 16 * pow(sin(i), 3);
				const y = -r * (13 * cos(i) - 5 * cos(2 * i) - 2 * cos(3 * i) - cos(4 * i));
				vertex(x, y);
			}
			endShape(CLOSE);
		} else if (shape === "star") {
			let angle = TWO_PI / 5;
			let halfAngle = angle / 2.0;
			beginShape();
			for (let a = 0; a < TWO_PI; a += angle) {
				let sx = cos(a) * (this.radius / 2);
				let sy = sin(a) * (this.radius / 2);
				vertex(sx, sy);
				sx = cos(a + halfAngle) * this.radius;
				sy = sin(a + halfAngle) * this.radius;
				vertex(sx, sy);
			}
			endShape(CLOSE);
		} else if (shape === "text") {
			textSize(this.radius * 2);
			textStyle(BOLD);
			strokeWeight(1);
			text(this.radius >= 0 ? this.text : "", 0, 0);
		}
	}

	update() {
		this.position.add(this.velocity);
		this.velocity.add(this.acceleration);
		this.acceleration.mult(0);
		this.velocity.limit(this.maxspeed);

		this.timer++;
	}

	applyForce(force) {
		this.acceleration.add(force);
		if (force != undefined) this.rotation += force.x / 8;
	}

	follow(vectors) {
		let x = floor(this.position.x / scale);
		let y = floor(this.position.y / scale);
		let index = x + y * cols;
		let force = vectors[index];
		this.applyForce(force);
	}

	applyStroke(c) {
		stroke(
			`rgba(${this.hexToRgb(c)}, ${map(abs(this.timer), 0, 255, 0, 100) / 40})`
		);
	}

	hexToRgb(hex) {
		var c;
		if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
			c = hex.substring(1).split("");
			if (c.length == 3) {
				c = [c[0], c[0], c[1], c[1], c[2], c[2]];
			}
			c = "0x" + c.join("");
			return `${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",")}`;
		}
		throw new Error("Bad Hex");
	}
}

// UTILS ----------

function addCheckbox(container, object, prop, name = prop, limitedProps) {
	container
		.add(object, prop)
		.name(name)
		.listen()
		.onChange(function () {
			if (limitedProps) {
				setChecked(object, prop, limitedProps);
			} else {
				setChecked(object, prop);
			}
			resetAndInit();
		});
}

function setChecked(object, prop, limitedProps) {
	if (limitedProps) {
		limitedProps.forEach((p) => {
			if (p == prop) {
				object[p] = true;
			} else {
				object[p] = false;
			}
		});
	} else {
		for (let p in object) {
			if (typeof p != Function || typeof p != Number) {
				object[p] = false;
			}
		}
		object[prop] = true;
	}
}

function saveCanvas(canvas) {
	saveCanvas(canvas, "flowfield_art", "jpg");
}