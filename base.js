/* exported preload, setup, draw */
/* global memory, dropper, restart, rate, slider, activeScore, bestScore, fpsCounter */
/* global p4_inspirations, p4_initialize, p4_render, p4_mutate */

let bestDesign;
let currentDesign;
let currentScore;
let currentInspiration;
let currentCanvas;
let currentInspirationPixels;

//starting number of regions, higher numbers are much slower due to an increase in get() calls
let IMAGE_NUM_REGIONS_X = 8;
let IMAGE_NUM_REGIONS_Y = 8;

let COLOR_CHANGE_MAX = 75;
let POSITION_CHANGE_MAX = 50;
let NUM_SHAPES_MAX = 1024; // arbitrary
let NUM_SHAPES_MIN = 8;

let NEW_SHAPE_RANGE_DIV = 200;

function preload() {
  let allInspirations = p4_inspirations();

  for (let i = 0; i < allInspirations.length; i++) {
    let insp = allInspirations[i];
    insp.image = loadImage(insp.assetUrl);
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = insp.name;
    dropper.appendChild(option);
  }
  dropper.onchange = e => inspirationChanged(allInspirations[e.target.value]);
  currentInspiration = allInspirations[0];

  restart.onclick = () =>
    inspirationChanged(allInspirations[dropper.value]);
}

function inspirationChanged(nextInspiration) {
  currentInspiration = nextInspiration;
  currentDesign = undefined;
  memory.innerHTML = "";
  setup();
}



function setup() {
  currentCanvas = createCanvas(width, height);
  currentCanvas.parent(document.getElementById("active"));
  currentScore = Number.NEGATIVE_INFINITY;
  currentDesign = p4_initialize(currentInspiration);
  bestDesign = currentDesign;
  image(currentInspiration.image, 0,0, width, height);
  loadPixels();
  currentInspirationPixels = pixels;
}

function evaluate() {
  loadPixels();

  let error = 0;
  let n = pixels.length;
  
  for (let i = 0; i < n; i++) {
    error += sq(pixels[i] - currentInspirationPixels[i]);
  }
  return 1/(1+error/n);
}



function memorialize() {
  let url = currentCanvas.canvas.toDataURL();

  let img = document.createElement("img");
  img.classList.add("memory");
  img.src = url;
  img.width = width;
  img.height = height;
  img.title = currentScore;

  document.getElementById("best").innerHTML = "";
  document.getElementById("best").appendChild(img.cloneNode());

  img.width = width / 2;
  img.height = height / 2;

  memory.insertBefore(img, memory.firstChild);

  if (memory.childNodes.length > memory.dataset.maxItems) {
    memory.removeChild(memory.lastChild);
  }
}

let mutationCount = 0;

function draw() {
  
  if(!currentDesign) {
    return;
  }
  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));
  rate.innerHTML = slider.value;
  p4_mutate(currentDesign, currentInspiration, slider.value/100.0);
  
  randomSeed(0);
  p4_render(currentDesign, currentInspiration);
  let nextScore = evaluate();
  activeScore.innerHTML = nextScore;
  if (nextScore > currentScore) {
    currentScore = nextScore;
    bestDesign = currentDesign;
    memorialize();
    bestScore.innerHTML = currentScore;
  }
  
  fpsCounter.innerHTML = Math.round(frameRate());
}

function p4_inspirations() {
	let inspiration_array = [];
	
	inspiration_array.push(new Inspiration("duck", "http://st2.depositphotos.com/1037163/9523/i/110/depositphotos_95233928-stock-photo-male-mallard-duck.jpg"));
	inspiration_array.push(new Inspiration ("heron","https://2.bp.blogspot.com/-_UfM2LENOO0/UqwF14sk07I/AAAAAAAAaQ0/nhut_qK4Qak/s400/Great+Blue+Heron+Bird+Wallpapers.jpg"));
	inspiration_array.push(new Inspiration("macaw", "https://images.pexels.com/photos/2540644/pexels-photo-2540644.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"));
	return inspiration_array;
}

function Inspiration(name_, assetUrl) {
	this.name = name_;
	this.assetUrl = assetUrl;
}

//i wanted my initialize function to work for any input instead of hardcoding
//though it is much slower with larger images because of get()
function p4_initialize(given_inspiration) {
	//get height and width
	let image_width = given_inspiration.image.width;
	let image_height = given_inspiration.image.height;
	
	let current_scale_x = width/image_width;
	let current_scale_y = height/image_height;
	
	//split image into some number of sections
	let image_region_width = image_width/IMAGE_NUM_REGIONS_X;
	let image_region_height = image_height/IMAGE_NUM_REGIONS_Y;
	
	//make a new array of custom shapes
	let shape_array = [];
	
	for (let i = 0; i < image_width; i += image_region_width) {
		for (let j = 0; j < image_height; j += image_region_height) {
			
			//get() is super slow, unfortunately, especially on a large image
			let x1 = (i + image_region_width/2) * current_scale_x;
			let y1 = j * current_scale_y;
			let x2 = (i + image_region_width/2) * current_scale_x;
			let y2 = (j + image_region_height) * current_scale_y;
			let cx1 = i * current_scale_x;
			let cy1 = (j + image_region_height/2) * current_scale_y;
			let cx2 = (i + image_region_width) * current_scale_x;
			let cy2 = (j + image_region_height/2) * current_scale_y;
			
			let shape_r = given_inspiration.image.get(i, j)[0];
			let shape_g = given_inspiration.image.get(i, j)[1];
			let shape_b = given_inspiration.image.get(i, j)[2];
			
			//add new shape to shape array
			//it's stored as an array because stringify doesn't like nested objects
			//let custom_shape = [i + image_region_width/2, j, i + image_region_width/2, j + image_region_height, i, j + image_region_height/2, i + image_region_width, j + image_region_height/2, shape_r, shape_g, shape_b];
			let custom_shape = [x1, y1, x2, y2, cx1, cy1, cx2, cy2, shape_r, shape_g, shape_b];
			shape_array.push(custom_shape);
		}
	}
	
	return new Design_Object(image_width, image_height, 0, 0, 0, shape_array);
}

function Design_Object(width_, height_, background_color_r_, background_color_g_, background_color_b_, shape_array_) {
	//height and width may be redundant for now, but could be useful at some point?
	this.width = width_;
	this.height = height_;
	this.r = background_color_r_;
	this.g = background_color_g_;
	this.b = background_color_b_;
	this.shape_array = shape_array_;
}

function p4_render(currentDesign_, currentInspiration_) {
	let background_color = color(currentDesign_.r, currentDesign_.g, currentDesign_.b)
	//let current_scale_x = width/currentDesign.width;
	//let current_scale_y = height/currentDesign.height;
	
	background(background_color);
	noStroke();
	
	for (let i = 0; i < currentDesign_.shape_array.length; i++) {
		//fill(currentDesign_.shape_array[i].color);
		let shape_color = color(currentDesign_.shape_array[i][8], currentDesign_.shape_array[i][9], currentDesign_.shape_array[i][10]);
		fill(shape_color);
		
		beginShape();
		vertex(currentDesign_.shape_array[i][0], currentDesign_.shape_array[i][1]);
		bezierVertex(currentDesign_.shape_array[i][6], currentDesign_.shape_array[i][7], currentDesign_.shape_array[i][6], currentDesign_.shape_array[i][7], currentDesign_.shape_array[i][2], currentDesign_.shape_array[i][3]);
		bezierVertex(currentDesign_.shape_array[i][4], currentDesign_.shape_array[i][5], currentDesign_.shape_array[i][4], currentDesign_.shape_array[i][5], currentDesign_.shape_array[i][0], currentDesign_.shape_array[i][1]);
		endShape();
		
		//circle(currentDesign_.shape_array[i][0] * current_scale_x, currentDesign_.shape_array[i][1] * current_scale_y, currentDesign_.shape_array[i][3] * current_scale_x);
	}
}

function p4_mutate(currentDesign, currentInspiration, mutation_amount) {
	//mutation is doable since the mutate function is only passed one design??
	
	// choose a parameter to change
	let random_number = random();
	
	if (random_number < 0.6) {
		let index = Math.floor(random(currentDesign.shape_array.length));
	
		currentDesign.shape_array[index][0] += mutation_amount * POSITION_CHANGE_MAX * (random() - 0.5);
		currentDesign.shape_array[index][1] += mutation_amount * POSITION_CHANGE_MAX* (random() - 0.5);
		
		currentDesign.shape_array[index][2] += mutation_amount * POSITION_CHANGE_MAX * (random() - 0.5);
		currentDesign.shape_array[index][3] += mutation_amount * POSITION_CHANGE_MAX * (random() - 0.5);
		
		currentDesign.shape_array[index][4] += mutation_amount * POSITION_CHANGE_MAX * (random() - 0.5);
		currentDesign.shape_array[index][5] += mutation_amount * POSITION_CHANGE_MAX * (random() - 0.5);
		
		currentDesign.shape_array[index][6] += mutation_amount * POSITION_CHANGE_MAX * (random() - 0.5);
		currentDesign.shape_array[index][7] += mutation_amount * POSITION_CHANGE_MAX * (random() - 0.5);
		
		currentDesign.shape_array[index][8] += mutation_amount * COLOR_CHANGE_MAX * (random() - 0.5);
		currentDesign.shape_array[index][9] += mutation_amount * COLOR_CHANGE_MAX * (random() - 0.5);
		currentDesign.shape_array[index][10] += mutation_amount * COLOR_CHANGE_MAX * (random() - 0.5);
	}
	else if (random_number < 0.9) {
		if (random() < mutation_amount && currentDesign.shape_array.length < NUM_SHAPES_MAX) {
			//random numbers
			let random_x = random(0, width);
			let random_y = random(0, height);
		
			let x_range = width/NEW_SHAPE_RANGE_DIV;
			let y_range = height/NEW_SHAPE_RANGE_DIV;
		
			let x1 = random_x + random(-x_range, x_range);
			let y1 = random_y + random(-y_range, y_range);
			let x2 = random_x + random(-y_range, y_range);
			let y2 = random_y + random(-y_range, y_range);
			let cx1 = random_x + random(-x_range, x_range);
			let cy1 = random_y + random(-y_range, y_range);
			let cx2 = random_x + random(-x_range, x_range);
			let cy2 = random_y + random(-y_range, y_range);
		
			//sampling colors from the image feels a bit cheaty + get() is really, really slow
			//let r = currentInspiration.image.get(random_x, random_y)[0];
			//let g = currentInspiration.image.get(random_x, random_y)[1];
			//let b = currentInspiration.image.get(random_x, random_y)[2];
		
			let r = random(0, 255);
			let g = random(0, 255);
			let b = random(0, 255);
		
			//let custom_shape = [random_x + random(-currentDesign.width/IMAGE_NUM_REGIONS), currentDesign.width/IMAGE_NUM_REGIONS), random_y + random(-currentDesign.height/IMAGE_NUM_REGIONS, currentDesign.height/IMAGE_NUM_REGIONS), random_x + random(-currentDesign.width/IMAGE_NUM_REGIONS, currentDesign.width/IMAGE_NUM_REGIONS), random_y + random(-currentDesign.height/IMAGE_NUM_REGIONS, currentDesign.height/IMAGE_NUM_REGIONS), random_x + random(-currentDesign.width/IMAGE_NUM_REGIONS, currentDesign.width/IMAGE_NUM_REGIONS), random(-currentDesign.height/IMAGE_NUM_REGIONS, currentDesign.heigt/IMAGE_NUM_REGIONS), random(-currentDesign.height/IMAGE_NUM_REGIONS, currentDesign.height/IMAGE_NUM_REGIONS), random(0, 255), random(0, 255), random(0, 255)];
			let custom_shape = [x1, y1, x2, y2, cx1, cy1, cx2, cy2, r, g, b];
			currentDesign.shape_array.push(custom_shape);
		}	
		else if (random() < mutation_amount && currentDesign.shape_array.length > NUM_SHAPES_MIN) {
			currentDesign.shape_array.splice(random(0, currentDesign.shape_array.length), 1);
		}
	}
	else {
		currentDesign.r = random(0, 255);
		currentDesign.g = random(0, 255);
		currentDesign.b = random(0, 255);
	}
}