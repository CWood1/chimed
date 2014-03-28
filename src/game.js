// TODO: Cam, I've saved the canvas width and height in the globals, canvasWidth and canvasHeight. Can you go through and,
// for all the center() functions, and anywhere else where canvas is passed for the sole purpose of getting its dimensions,
// and for that matter if I've missed anywhere where I still reference an image for the canvas dimensions, can you correct
// this? Thanks

function Reactive(initial) {
	this.value = initial;
	this.callbacks = [];

	this.set = function(value) {
		if(value != this.value) {
			this.value = value;

			for(var i = 0; i < this.callbacks.length; i++) {
				this.callbacks[i](value);
			}
		}
	}

	this.get = function() {
		return this.value;
	}

	this.onChange = function(callback) {
		this.callbacks.push(callback);
	}

	this.offChange = function(callback) {
		for(var i = 0; i < this.callbacks.length; i++) {
			if(this.callbacks[i] == callback) {
				this.callbacks.splice(i, 1);
			}
		}
	}
}

var sound = new Reactive(true);
var music = new Reactive(true);
var score = new Reactive(0);
var lives = new Reactive(0);
var currentHighScore = new Reactive(0);
var scoreMultiplier = 0;
var spawnRate = 0;
var busy = false;

var canvasWidth = 0;
var canvasHeight = 0;

function addDbgStatus(status) {
	var para = document.createElement("p");
	para.innerHTML = status;
	document.getElementById("debugConsole").appendChild(para);
	//Makes the debug window scroll to the bottom every time a new status occurs. 
	document.getElementById("debugConsole").scrollTop = document.getElementById("debugConsole").scrollHeight;
	return para;
}

function pageToLocalCoords(x, y) {
	var canvas = document.getElementById("mainGame");
	
	var locX = x - canvas.offsetLeft;
	var locY = y - canvas.offsetTop;
	
	return {x : locX,
		y : locY};
}

function checkSoundSupport() {
	audio = new Audio();

	if(audio.canPlayType('audio/ogg; codecs="vorbis"') != "") {
		return 1;
	} else if(audio.canPlayType('audio/mp3') != "") {
		return 2;
	} else {
		// Give up
		return -1;
	}
}

function Music(file) {
	this.audio = new Audio(file);
	var that = this;
		// Used for the callback

	this.play = function() {
		if(music.get()) {
			this.audio.play();
		}
	}

	this.stop = function() {
		this.audio.pause();
	}

	this.audio.addEventListener('ended', function() {
		this.currentTime = 0;

		if(music) {
			this.play();
		}
	}, false);

	music.onChange(function(value) {
		if(value == true) {
			that.audio.currentTime = 0;

			that.audio.play();
		} else {
			that.audio.pause();
		}
	});

	if(music.get()) {
		this.audio.play();
	}
}

function EventSound(file) {
	if(sound.get()) {
		audio = new Audio(file);
			// Hahaha audiophile xD
	
		audio.play();

		sound.onChange(function(value) {
			if(value == false) {
				audio.pause();
			}
				// No onchange to true, as by that time, the sound will have gone
		});
	}
}

function Sprite(image, onMouseClick) {
	var that = this;
	this.x = 0;				// Store the x and y coordinates
	this.y = 0;
	this.zIndex = 0;		// This is used for image sequencing

	this.width = 0;
	this.height = 0;
	this.loaded = false;

	this.image = new Image();
	this.image.onload = function() {
		that.width = this.width;
		that.height = this.height;

		that.loaded = true;
	}

	this.image.src = image;	// Save the image itself

	this.enabled = true;

	// Methods
	this.draw = draw;
	function draw(renderingContext) {
		if(!this.loaded) {
			return;
		}

		renderingContext.drawImage(this.image, this.x, this.y);
	}
	
	this.checkMouse = checkMouse;
	function checkMouse(x, y) {
		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			return true;
		} else {
			return false;
		}
	}
	
	this.onMouseHover = onMouseHover;
	function onMouseHover(x, y) {

	}

	this.onMouseClick = onMouseClick;

	this.onMouseOut = onMouseOut;
	function onMouseOut() {

	}
}

function Animation(continuable) {
	if(typeof(continuable) === 'undefined') {
		continuable = true;
	}

	var that = this;

	this.slides = [];
	this.onCompleteC = [];
	this.activeSlide = 0;
	this.enabled = true;
	this.continuable = continuable;

	this.completed = false;

	this.skip = new Menu(0, 0);
	this.cont = new Menu(0, 0);

	this.interval = {};

	var skipItem = new MenuOption("Skip", function() {
		that.complete();
	});

	this.skip.newOption(skipItem);
	this.skip.open = true;
	this.skip.autoClose = false;
	
	var contItem = new MenuOption("Continue", function() {
		that.nextFrame();
	});

	this.cont.newOption(contItem);
	this.cont.open = this.continuable;
	this.cont.autoClose = false;

	this.complete = function() {
		clearTimeout(this.interval);

		this.completed = true;

		for(var i = 0; i < this.onCompleteC.length; i++) {
			this.onCompleteC[i]();
		}
	}

	this.nextFrame = function() {
		clearTimeout(this.interval);
		changeSlides();
	}

	this.addSlide = function(slide, duration) {
		var newSlide = slide;
		newSlide.duration = duration;

		this.slides.push(newSlide);
	}

	this.onComplete = function(callback) {
		this.onCompleteC.push(callback);
	}

	this.draw = function(renderingContext) {
		if(!this.completed) {
			this.skip.draw(renderingContext);
				// This will be drawn over; this is to get the width
			this.slides[this.activeSlide].draw(renderingContext);

			this.cont.x = 0;
			this.cont.y = canvasHeight - this.cont.height;

			this.cont.draw(renderingContext);

			this.skip.x = canvasWidth - this.skip.width;
			this.skip.y = canvasHeight - this.skip.height;

			this.skip.draw(renderingContext);
		}
	}

	this.checkMouse = function(x, y) {
		if(this.completed) {
			return false;
		}

		return this.slides[this.activeSlide].checkMouse(x, y);
	}

	this.onMouseHover = function(x, y) {
		if(this.completed) {
			return;
		}

		if(this.skip.checkMouse(x, y)) {
			this.skip.onMouseHover(x, y);
		} else if(this.continuable && this.cont.checkMouse(x, y)) {
			this.cont.onMouseHover(x, y);
		} else {
			this.slides[this.activeSlide].onMouseHover(x, y);
		}
	}

	this.onMouseClick = function(x, y) {
		if(this.completed) {
			return;
		}

		if(this.skip.checkMouse(x, y)) {
			this.skip.onMouseClick(x, y);
		} else if(this.continuable && this.cont.checkMouse(x, y)) {
			this.cont.onMouseClick(x, y);
		} else {
			this.slides[this.activeSlide].onMouseClick(x, y);
		}
	}

	this.onMouseOut = function() {
		if(this.completed) {
			return;
		}

		this.skip.onMouseOut();
		this.cont.onMouseOut();
		this.slides[this.activeSlide].onMouseOut();
	}

	function changeSlides() {
		that.activeSlide++;

		if(that.activeSlide >= that.slides.length) {
			this.completed = true;

			for(var i = 0; i < that.onCompleteC.length; i++) {
				that.onCompleteC[i]();
			}
		} else {
			that.interval = setTimeout(changeSlides, that.slides[that.activeSlide].duration);
		}
	}

	this.start = function() {
		this.activeSlide = 0;
		this.completed = false;
		if(this.slides.length != 0) {
			this.interval = setTimeout(changeSlides, this.slides[this.activeSlide].duration);
		}
	}
}

function Timer(startTime, scale) {
	if(typeof(scale) === 'undefined') {
		scale = 1;
	}

	this.time = startTime;
	this.onSecondC = [];
	this.onTimeoutC = [];

	this.x = 0;
	this.y = 0;
	this.radius = 20*scale;
	this.enabled = true;

	this.textX = 0;
	this.textY = 0;
	this.text = false;
	this.fontSize = 10*scale;

	this.interval = {};
	this.selfDisabling = true;

	this.draw = function(renderingContext) {
		renderingContext.strokeStyle = "black";
		renderingContext.fillStyle = "white";

		renderingContext.beginPath();
		renderingContext.arc(this.x + this.radius, this.y + this.radius, this.radius,
				0, Math.PI * 2, false);
		renderingContext.fill();
		renderingContext.stroke();

		var theta = Math.PI * this.time / 30;
		renderingContext.save();

		renderingContext.translate(this.x + this.radius, this.y + this.radius);
		renderingContext.rotate(theta);

		renderingContext.beginPath();
		renderingContext.moveTo(0, 0.1*this.radius);
		renderingContext.lineTo(0, -0.9*this.radius);
		renderingContext.stroke();

		renderingContext.restore();

		if(this.text) {
			renderingContext.font = this.fontSize + "pt Arial";
			renderingContext.fillStyle = "black";

			renderingContext.fillText(this.time.toString(), this.textX, this.textY + this.fontSize);
		}
	}

	this.checkMouse = function(x, y) {
		var tmpX = x - (this.x + this.radius);
		var tmpY = y - (this.y + this.radius);

		if(tmpX*tmpX + tmpY*tmpY <= this.radius*this.radius) {
			return true;
		} else {
			return false;
		}
	}

	this.onMouseHover = function(x, y) {
		this.textX = x + this.fontSize;
		this.textY = y;
		this.text = true;
	}

	this.onMouseOut = function() {
		this.text = false;
	}

	this.onMouseClick = function(x, y) {

	}

	this.onSecond = function(callback) {
		this.onSecondC.push(callback);
	}

	this.onTimeout = function(callback) {
		this.onTimeoutC.push(callback);
	}

	this.start = function() {
		var that = this;
		this.interval = setInterval(function() {
			that.time--;

			for(var i = 0; i < that.onSecondC.length; i++) {
				that.onSecondC[i](that.time);
			}

			if(that.time == 0) {
				clearInterval(that.interval);

				if(that.selfDisabling) {
					that.enabled = false;
				}

				for(var i = 0; i < that.onTimeoutC.length; i++) {
					that.onTimeoutC[i]();
				}
			}
		}, 1000);
	}

	this.stop = function() {
		clearInterval(this.interval);
	}

	this.getTime = function() {
		return this.time;
	}
}

function MenuOption(text, action) {
	this.text = text;
	this.action = action;
	this.hover = false;
	this.active = true;	// Enabled by default

	this.subMenu = false;
}

function Menu(x, y, scale) {
	if(typeof(scale) === 'undefined') {
		scale = 1;
	}

	this.options = new Array();
	this.zIndex = 100;

	this.x = x;
	this.y = y;
	this.height = 0;
	this.width = 0;
	this.scale = scale;

	this.oneElHeight = 20 * this.scale;
	this.fontSize = 15 * this.scale;
	this.border = 1;

	this.open = false;
	this.enabled = true;
	this.clickOff = true;
	this.autoClose = true;

	// Methods
	this.close = close;
	function close() {
		while(this.options.length > 0) {
			var opt = this.options.pop();

			if(opt.subMenu != false) {
				opt.subMenu.close();
			}
		}

		this.open = false;
		this.enabled = false;
	}

	this.newOption = newOption;
	function newOption(option) {
		this.options.push(option);
		this.height += 2*this.border + this.oneElHeight;
	}

	this.draw = draw;
	function draw(renderingContext) {
		if(!this.open) {
			return;
		}

		renderingContext.beginPath();
		renderingContext.strokeStyle = "black";
		renderingContext.font = this.fontSize + "px Dnk";

		for(var i = 0; i < this.options.length; i++) {
			var dims = renderingContext.measureText(this.options[i].text);
			if(dims.width > this.width) {
				this.width = dims.width;

				this.width += 2*this.border;
			}
		}

		for(var i = 0; i < this.options.length; i++) {
			if(this.options[i].hover && this.options[i].active) {
				renderingContext.fillStyle = "#0000AA";
			} else if(this.options[i].hover && !this.options[i].active) {
				renderingContext.fillStyle = "#777777";
			} else if(!this.options[i].hover && this.options[i].active) {
				renderingContext.fillStyle = "#0000FF";
			} else {
				renderingContext.fillStyle = "#AAAAAA";
			}

			renderingContext.fillRect(this.x + this.border,
					this.y + i*this.oneElHeight + 2*i*this.border + this.border,
					this.width, this.oneElHeight);
			renderingContext.strokeRect(this.x, this.y + i*this.oneElHeight + 2*i*this.border,
					this.width + 2*this.border, this.oneElHeight + 2*this.border);
			renderingContext.fillStyle = "white";
			renderingContext.fillText(this.options[i].text, this.x + (this.width / 2) -
							(renderingContext.measureText(this.options[i].text).width / 2),
					this.y + this.fontSize + this.border + i*this.oneElHeight + 2*i*this.border);

			if(this.options[i].hover && this.options[i].subMenu != false) {
				this.options[i].subMenu.draw(renderingContext);
			}
		}
	}

	this.center = center;
	function center(canvas, renderingContext) {
		renderingContext.beginPath();
		renderingContext.strokeStyle = "black";
		renderingContext.font = this.fontSize + "px Dnk";

		for(var i = 0; i < this.options.length; i++) {
			var dims = renderingContext.measureText(this.options[i].text);
			if(dims.width > this.width) {
				this.width = dims.width;

				this.width += 2*this.border;
			}
		}

		this.x = (canvas.width / 2) - (this.width / 2);
		this.y = (canvas.height / 2) - (this.oneElHeight * this.options.length / 2);
	}
	
	this.checkMouse = checkMouse;
	function checkMouse(x, y) {
		if(!this.open) {
			return false;
		}

		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			return true;
		} else {
			for(var i = 0; i < this.options.length; i++) {
				if(this.options[i].subMenu != false && this.options[i].hover) {
					return this.options[i].subMenu.checkMouse(x, y);
				}
			}
			
			return false;
		}
	}

	this.onMouseHover = onMouseHover;
	function onMouseHover(x, y) {
		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			var yOff = y - this.y;

			for(var i = 0; i < this.options.length; i++) {
				if(yOff >= i*this.oneElHeight + 2*i*this.border && yOff < i*this.oneElHeight + this.oneElHeight + 2*i*this.border + 2*this.border) {
					this.options[i].hover = true;

					if(this.options[i].subMenu != false && this.options[i].active) {
						this.options[i].subMenu.onMouseOut();
						this.options[i].subMenu.x = this.x + this.width + 2*this.border;
						this.options[i].subMenu.y = this.y + i*this.oneElHeight + 2*i*this.border;
						this.options[i].subMenu.open = true;
					}
				} else {
					this.options[i].hover = false;

					if(this.options[i].subMenu != false) {
						this.options[i].subMenu.onMouseOut();
						this.options[i].subMenu.open = false;	// We can't call close here, as it removes all options from the menu
					}

				}
			}
		} else {
			for(var i = 0; i < this.options.length; i++) {
				if(this.options[i].hover && this.options[i].subMenu != false) {
					this.options[i].subMenu.onMouseHover(x, y);
				}
			}
		}
	}

	this.onMouseClick = onMouseClick;
	function onMouseClick(x, y) {
		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			for(var i = 0; i < this.options.length; i++) {
				if(this.options[i].hover && this.options[i].active) {
					this.options[i].action();
					break;
				}
			}
		} else {
			for(var i = 0; i < this.options.length; i++) {
				if(this.options[i].hover && this.options[i].subMenu != false) {
					this.options[i].subMenu.onMouseClick(x, y);
				}
			}
		}

		if(this.autoClose) {
			this.close();
		}
	}

	this.onMouseOut = onMouseOut;
	function onMouseOut() {
		for(var i = 0; i < this.options.length; i++) {
			this.options[i].hover = false;

			if(this.options[i].subMenu != false) {
				this.options[i].subMenu.onMouseOut();
				this.options[i].subMenu.open = false;
			}
		}
	}
}

function MessageBox(x, y, titleText, message, scale) {
	if(typeof(scale) === 'undefined') {
		scale = 1;
	}

	this.message = message;
	this.titleText = titleText;
	this.options = new Array();

	this.open = false;
	this.enabled = true;
	this.clickOff = false;
	this.closable = true;

	this.zIndex = 100;

	this.x = x;
	this.y = y;
	this.height = 0;
	this.width = 0;

	this.scale = scale;

	this.fontSize = 15 * this.scale;
	this.lineHeight = 20 * this.scale;
	this.border = 1;

	// Methods
	this.close = function() {
		this.open = false;
		this.enabled = false;
	}

	this.newOption = function(option) {
		this.options.push(option);
	}

	this.draw = function(renderingContext) {
		if(!this.open) {
			return;
		}

		this.width = 0;

		renderingContext.beginPath();
		renderingContext.strokeStyle = "black";
		renderingContext.font = this.fontSize + "px Dnk";

		lines = this.message.split("\n");

		this.height = (lines.length + 1)*this.lineHeight + 3*this.border;
			// Don't subtract 1, as we'll need the title text
			// One border for the top, one for the bottom, and one between the title and the message

		for(var i = 0; i < lines.length; i++) {
			if(renderingContext.measureText(lines[i]).width + 2*this.border + 2 > this.width) {
				this.width = renderingContext.measureText(lines[i]).width + 2*this.border + 2;
			}
		}

		if(renderingContext.measureText(this.titleText).width +
				(this.closable ? this.lineHeight : 0) + 2*this.border + 2 > this.width) {
			this.width = renderingContext.measureText(this.titleText).width +
				(this.closable ? this.lineHeight : 0) +	2*this.border + 2;
		}

		var buttonWidth = 0;
		if(this.options.length != 0) {
			var cur = 2*this.border;

			for(var i = 0; i < this.options.length; i++) {
				cur += 2*this.border + renderingContext.measureText(this.options[i].text).width;
			}

			if(cur > this.width) {
				this.width = cur;
			}

			this.height += this.lineHeight + 6*this.border;

			buttonWidth = cur - 2*this.border + 2;
		}

		renderingContext.fillStyle = "#0000FF";

		renderingContext.fillRect(this.x + this.border, this.y + this.border, this.width, this.lineHeight);
		renderingContext.strokeRect(this.x, this.y,
				this.width + 2*this.border, this.lineHeight + 2*this.border);
		renderingContext.fillStyle = "white";

		renderingContext.fillText(this.titleText, 
				this.x + ((this.width - (this.closable ? this.lineHeight : 0)) / 2) -
					(renderingContext.measureText(this.titleText).width / 2),
				this.y + this.fontSize + this.border);

		if(this.closable) {
			renderingContext.fillStyle = "#FF0000";

			renderingContext.fillRect(this.x + this.border + this.width - this.lineHeight, this.y + this.border,
					this.lineHeight, this.lineHeight);
		}

		renderingContext.fillStyle = "#0000FF";

		renderingContext.fillRect(this.x + this.border, this.y + 2*this.border + this.lineHeight,
				this.width, this.height - (this.lineHeight + 
					(this.options.length != 0 ? this.lineHeight + this.border : 0)));
		renderingContext.strokeRect(this.x, this.y + this.lineHeight + this.border,
				this.width + 2*this.border, this.height + 2*this.border - (this.lineHeight + 
					(this.options.length != 0 ? this.lineHeight + this.border : 0)));

		renderingContext.fillStyle = "white";
		for(var i = 0; i < lines.length; i++) {
			renderingContext.fillText(lines[i], this.x + (this.width / 2) -
						(renderingContext.measureText(lines[i]).width / 2),
					this.y + this.fontSize + 2*this.border + this.lineHeight*(i+1));
		}

		if(this.options.length != 0) {
			renderingContext.fillStyle = "#0000FF";

			renderingContext.fillRect(this.x + this.border,
					this.y + 3*this.border + this.height - (this.lineHeight + 1),
					this.width, this.lineHeight + 4*this.border);
			renderingContext.strokeRect(this.x, this.y + 2*this.border + this.height - (this.lineHeight + 1),
					this.width + 2*this.border, this.lineHeight + 6*this.border);

			var widthSoFar = 0;
			for(var i = 0; i < this.options.length; i++) {
				var itemWidth = renderingContext.measureText(this.options[i].text).width;

				this.options[i].x = this.x + (this.width / 2) + widthSoFar + 2*(i+1)*this.border
						- (buttonWidth / 2);
				this.options[i].y = this.y + 3*this.border + this.height - this.lineHeight;
				this.options[i].width = itemWidth + 2*this.border;
				this.options[i].height = this.lineHeight + 2*this.border;

				if(this.options[i].hover) {
					renderingContext.fillStyle = "#0000AA";

					renderingContext.fillRect(this.options[i].x + this.border,
							this.options[i].y + this.border,
							this.options[i].width - 2*this.border,
							this.options[i].height - 2*this.border);
				}

				renderingContext.strokeRect(this.options[i].x, this.options[i].y,
						this.options[i].width, this.options[i].height);

				renderingContext.fillStyle = "white";
				renderingContext.fillText(this.options[i].text,
						this.options[i].x + this.border,
						this.options[i].y + this.fontSize);


				widthSoFar += this.options[i].width;
			}
		}
	}

	this.center = function(canvas, renderingContext) {
		renderingContext.beginPath();
		renderingContext.strokeStyle = "black";
		renderingContext.font = this.fontSize + "px Dnk";

		this.height = (this.message.split("\n").length + 1)*this.lineHeight + 3*this.border;
			// Don't subtract 1, as we'll need the title text
			// One border for the top, one for the bottom, and one between the title and the message

		lines = this.message.split("\n");

		for(var i = 0; i < lines.length; i++) {
			if(renderingContext.measureText(lines[i]).width + 2*this.border > this.width) {
				this.width = renderingContext.measureText(lines[i]).width + 2*this.border;
			}
		}

		if(renderingContext.measureText(this.titleText).width + (this.closable ? this.lineHeight : 0)
				+ 2*this.border > this.width) {
			this.width = renderingContext.measureText(this.titleText).width +
				(this.closable ? this.lineHeight : 0) + 2*this.border;
		}

		if(this.options.length != 0) {
			var cur = 2*this.border;

			for(var i = 0; i < this.options.length; i++) {
				cur += 2*this.border + renderingContext.measureText(this.options[i].text).width;
			}

			if(cur > this.width) {
				this.width = cur;
			}

			this.height += this.lineHeight + 6*this.border;
		}

		this.x = (canvas.width / 2) - (this.width / 2);
		this.y = (canvas.height / 2) - (this.height / 2);
	}

	this.checkMouse = function(x, y) {
		if(!this.open) {
			return false;
		}

		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			return true;
		} else {
			return false;
		}
	}

	this.onMouseHover = function(x, y) {
		for(var i = 0; i < this.options.length; i++) {
			if(x >= this.options[i].x && x <= this.options[i].x + this.options[i].width &&
					y >= this.options[i].y && y <= this.options[i].y + this.options[i].height) {
				this.options[i].hover = true;
			} else {
				this.options[i].hover = false;
			}
		}
	}

	this.onMouseClick = function(x, y) {
		if(this.y + this.border <= y && this.y + this.lineHeight + this.border >= y &&
				this.x + this.border + this.width - this.lineHeight <= x &&
				this.x + this.border + this.width >= x && this.closable) {
			this.close();
		}

		for(var i = 0; i < this.options.length; i++) {
			if(x >= this.options[i].x && x <= this.options[i].x + this.options[i].width &&
					y >= this.options[i].y && y <= this.options[i].y + this.options[i].height) {
				this.options[i].action();
			}
		}
	}

	this.onMouseOut = function(x, y) {
		for(var i = 0; i < this.options.length; i++) {
			this.options[i].hover = false;
		}
	}
}

function SpriteList() {
	this.list = new Array();	// Store the sprites themselves

	this.currentHover = false;
	this.enabled = true;

	this.zIndex = 0;

	this.activeMenu = false;

	// Methods
	this.appendSprite = appendSprite;
	function appendSprite(sprite) {
		this.list.push(sprite);

		this.list.sort(function(a, b) {	// Ensure that we're sorted by the zIndex of the sprites
			return a.zIndex - b.zIndex;
		});
	}

	this.draw = draw;
	function draw(renderingContext) {
		for(var i = 0; i < this.list.length; i++) {
			if(this.list[i].enabled == false) {
				this.list.splice(i, 1);
			} else {
				this.list[i].draw(renderingContext);
			}
		}

		if(this.activeMenu != false) {
			this.activeMenu.draw(renderingContext);
		}
	}

	this.checkMouse = checkMouse;
	function checkMouse(x, y) {
		if(this.activeMenu != false && this.activeMenu.checkMouse(x, y) != false) {
			return this.activeMenu;
		}

		for(var i = this.list.length - 1; i >= 0; i--) {
			// Traverse the list backwards, because zIndex
			if(this.list[i].enabled && this.list[i].checkMouse(x, y) != false) {
				return this.list[i];
			}
		}
		
		return false;
	}

	this.onMouseHover = onMouseHover;
	function onMouseHover(x, y) {
		if(this.currentHover == false || this.currentHover.enabled == false) {
			this.currentHover = this.checkMouse(x, y);

			if(this.currentHover == false) {
				return;	// Give up and go home
			}
		} else {
			if(this.currentHover != this.checkMouse(x, y)) {
				this.currentHover.onMouseOut();
				this.currentHover = this.checkMouse(x, y);

				if(this.currentHover == false) {
					return;	// Give up and go home
				}
			}
		}

		this.currentHover.onMouseHover(x, y);
	}

	this.onMouseOut = onMouseOut;
	function onMouseOut() {
		if(this.currentHover != false) {
			this.currentHover.onMouseOut();

			this.currentHover = false;
		}
	}

	this.onMouseClick = onMouseClick;
	function onMouseClick(x, y) {
		if(this.currentHover != false) {
			if(this.activeMenu != false && this.activeMenu.open && this.currentHover != this.activeMenu) {
				if(this.activeMenu.clickOff) {
					this.activeMenu.close();
					this.activeMenu = false;
				}
			} else {
				this.currentHover.onMouseClick(x, y);

				if(!this.currentHover.enabled) {
					this.onMouseHover(x, y);
				}
			}
		} else if(this.activeMenu != false && this.activeMenu.open) {
			this.activeMenu.close();
			this.activeMenu = false;
		}
	}
}

function Patient(x, y) {
	var that = this;

	this.enabled = true;
	this.zIndex = 5;
		// Defaults, to allow this to function as a sprite
	
	this.x = x;
	this.y = y;

	this.type = Math.floor(Math.random() * 8);
	if(this.type == 8) {
		this.type = 7;
	}

	this.sprite = new Sprite("patient" + this.type.toString() + ".jpg", function(x, y) {
		if(!busy) {
			that.timer.stop();
			busy = that;

			var timeout = 0;

			switch(that.type) {
				case 0:
				case 4:
					timeout = 4;
					break;
				case 1:
				case 5:
					timeout = 6;
					break;
				case 2:
				case 6:
					timeout = 8;
					break;
				case 3:
				case 7:
					timeout = 10;
					break;
			}

			setTimeout(function() {
				that.enabled = false;
				busy = false;

				score.set(score.get() + that.timer.getTime() * scoreMultiplier);
				schedulePatient(that.x, that.y);
			}, timeout * 1000);
		}
	});
	this.timer = {};

	switch(this.type) {
		case 0:
		case 4:
			this.timer = new Timer(30);
			break;
		case 1:
		case 5:
			this.timer = new Timer(24);
			break;
		case 2:
		case 6:
			this.timer = new Timer(18);
			break;
		case 3:
		case 7:
			this.timer = new Timer(12);
			break;
	}

	this.timer.onTimeout(function() {
		that.enabled = false;
		lives.set(lives.get() - 1);

		if(busy == this) {
			busy = false;
		}

		schedulePatient(that.x, that.y);
	});

	this.timer.start();

	this.draw = function(renderingContext) {
		this.timer.x = this.x + 52;
		this.timer.y = this.y;

		this.sprite.x = this.x;
		this.sprite.y = this.y + 50;

		this.sprite.draw(renderingContext);
		this.timer.draw(renderingContext);
	}

	this.checkMouse = function(x, y) {
		return this.sprite.checkMouse(x, y) || this.timer.checkMouse(x, y);
	}

	this.onMouseHover = function(x, y) {
		if(this.sprite.checkMouse(x, y)) {
			this.sprite.onMouseHover(x, y);
		} else if(this.timer.checkMouse(x, y)) {
			this.timer.onMouseHover(x, y);
		}
	}

	this.onMouseClick = function(x, y) {
		if(this.sprite.checkMouse(x, y)) {
			this.sprite.onMouseClick(x, y);
		} else if(this.timer.checkMouse(x, y)) {
			this.timer.onMouseClick(x, y);
		}
	}

	this.onMouseOut = function() {
		this.sprite.onMouseOut();
		this.timer.onMouseOut();
	}
}

function schedulePatient(x, y) {
	setTimeout(function() {
		var p = new Patient(x, y);

		gamePlay.appendSprite(p);
	}, Math.floor(Math.random() * spawnRate) * 1000);
}

function runGame() {
	var canvas = document.getElementById("mainGame");
	var renderingContext = canvas.getContext("2d");

	canvasWidth = canvas.width;
	canvasHeight = canvas.height;

	var soundSupport = checkSoundSupport();
	var musicFile = "";

	if(soundSupport == 1) {
		// Load in Vorbis files
		musicFile = "music.ogg";
	} else if(soundSupport == 2) {
		// Load in MP3 files
		musicFile = "music.mp3";
	}

	var backgroundMusic = new Music(musicFile);

	mainList = new SpriteList();

	mainMenu = new SpriteList();
	diffMenu = new SpriteList();
	gamePlay = new SpriteList();
	optsMenu = new SpriteList();
	credits = new SpriteList();
	highScore = new SpriteList();
	startScene = new SpriteList();
	gameOver = new SpriteList();

// Main menu //////////////////////////////////////////////////////////////////
	mainMenu.enabled = true;

	var mmBackground = new Sprite("background.jpg", function(x, y) { });
	mmBackground.zIndex = -1;
	mainMenu.appendSprite(mmBackground);

	var mmMenu = new Menu(0, 0, 1.5);
	mmMenu.autoClose = false;

	var mmMenuOptPlay = new MenuOption("Play", function() {
		mainMenu.enabled = false;
		diffMenu.enabled = true;
		//gamePlay.enabled = true;

		mainList.appendSprite(diffMenu);
	});
	var mmMenuOptOptions = new MenuOption("Options", function() {
		mainMenu.enabled = false;
		optsMenu.enabled = true;

		mainList.appendSprite(optsMenu);
	});
	var mmMenuOptCredits = new MenuOption("Credits", function() {
		mainMenu.enabled = false;
		credits.enabled = true;

		mainList.appendSprite(credits);
	});
	var mmMenuOptHighScore = new MenuOption("High Score", function() {
		mainMenu.enabled = false;
		highScore.enabled = true;

		mainList.appendSprite(highScore);
	});
	
	mmMenu.newOption(mmMenuOptPlay);
	mmMenu.newOption(mmMenuOptOptions);
	mmMenu.newOption(mmMenuOptCredits);
	mmMenu.newOption(mmMenuOptHighScore);

	mmMenu.zIndex = 100;
	mmMenu.open = true;
	mmMenu.center(canvas, renderingContext);
	mainMenu.appendSprite(mmMenu);

	mainList.appendSprite(mainMenu);

// Starting Cutscene //////////////////////////////////////////////////////////
	startScene.enabled = false;

	var intro = new Animation(false);

	var slide1 = new Sprite("Start_Slide_First.jpg", function(x, y) {

	});

	var slide2 = new Sprite("Start_Slide_Second.jpg", function(x, y) {

	});

	var slide3 = new Sprite("Start_Slide_Third.jpg", function(x, y) {

	});

	// TODO: Check these timings are correct with Lydia
	intro.addSlide(slide1, 1500);
	intro.addSlide(slide2, 1500);
	intro.addSlide(slide3, 1500);

	intro.zIndex = 100;
	intro.onComplete(function() {
		startScene.enabled = false;
		gamePlay.enabled = true;

		var firstPatient = new Patient(100, 50);
		gamePlay.appendSprite(firstPatient);

		schedulePatient(300, 50);
		schedulePatient(500, 50);

		mainList.appendSprite(gamePlay);
	});

	// TODO: Add callback to start the game itself (set up initial patients, start spawning of patients, etc.
	startScene.appendSprite(intro);

// Gameplay ///////////////////////////////////////////////////////////////////
	gamePlay.enabled = false;

	var background = new Sprite("background.jpg", function(x, y) {

	});

	background.zIndex = -5;
	gamePlay.appendSprite(background);

	var scoreBox = new MessageBox(0, 0, "Current Score", score.get().toString());
	scoreBox.closable = false;
	scoreBox.open = true;

	incresaeScore = new MenuOption("Update Score", function() {
		score.set(score.get() + 100);
	});
//	scoreBox.newOption(incresaeScore);

	score.onChange(function(value) {
		scoreBox.message = value.toString();
	});

	gamePlay.appendSprite(scoreBox);

	var livesBox = new MessageBox(0, 0, "Lives", score.get().toString());
	livesBox.closable = false;
	livesBox.open = true;

	// TODO: This here's debugging code, and will not be in the release version
	decreaseLives = new MenuOption("Update Lives", function() {
		lives.set(lives.get() - 1);
	});
//	livesBox.newOption(decreaseLives);

	lives.onChange(function(value) {
		livesBox.message = value.toString();
	});

	livesBox.center(canvas, renderingContext);
		// Calculate the width
	livesBox.y = 0;
	livesBox.x = canvasWidth - livesBox.width;

	gamePlay.appendSprite(livesBox);

// Difficulty menu ////////////////////////////////////////////////////////////
	diffMenu.enabled = false;
	
	diffBackground = new Sprite("background.jpg", function(x, y) { });
	diffBackground.zIndex = -5;
	diffMenu.appendSprite(diffBackground);
	
	dMenu = new Menu(0, 0, 1.5);
	dMenu.autoClose = false;
	dMenu.open = true;
	
	var dMenuEasy = new MenuOption("Easy", function(){
		scoreMultiplier = 1;
		spawnRate = 5;
		lives.set(10);
			// These will need balancing

		diffMenu.enabled = false;
		startScene.enabled = true;

		mainList.appendSprite(startScene);
		intro.start();
	});
	var dMenuMed = new MenuOption("Medium", function(){
		scoreMultiplier = 1;
		spawnRate = 5;
		lives.set(10);
			// These will need balancing

		diffMenu.enabled = false;
		startScene.enabled = true;

		mainList.appendSprite(startScene);
		intro.start();
	});
	var dMenuHard = new MenuOption("Hard", function(){
		scoreMultiplier = 1;
		spawnRate = 5;
		lives.set(10);
			// These will need balancing

		diffMenu.enabled = false;
		startScene.enabled = true;

		mainList.appendSprite(startScene);
		intro.start();
	});
	var dMenuRtn = new MenuOption("Return to menu", function(){ 
		diffMenu.enabled = false;
		mainMenu.enabled = true;
		
		mainList.appendSprite(mainMenu);
	});
	
	dMenu.newOption(dMenuEasy);
	dMenu.newOption(dMenuMed);
	dMenu.newOption(dMenuHard);
	dMenu.newOption(dMenuRtn);
	
	dMenu.center(canvas, renderingContext);
	
	diffMenu.appendSprite(dMenu);

// Options menu ///////////////////////////////////////////////////////////////
	optsMenu.enabled = false;

	optsBackground = new Sprite("background.jpg", function(x, y) { });
	optsBackground.zIndex = -1;
	optsMenu.appendSprite(optsBackground);

	oMenu = new Menu(0, 0, 1.5);
	oMenu.autoClose = false;
	oMenu.open = true;

	var oMenuToggleSound = new MenuOption("Sound off", function() {
		this.toggle = !this.toggle;
		sound.set(this.toggle);

		if(this.toggle) {
			this.text = "Sound off";
		} else {
			this.text = "Sound on";
		}
	});
	oMenuToggleSound.toggle = true;
	oMenu.newOption(oMenuToggleSound);

	var oMenuToggleMusic = new MenuOption("Music off", function() {
		this.toggle = !this.toggle;
		music.set(this.toggle);

		if(this.toggle) {
			this.text = "Music off";
		} else {
			this.text = "Music on";
		}
	});
	oMenuToggleMusic.toggle = true;
	oMenu.newOption(oMenuToggleMusic);

	oMenuBack = new MenuOption("Back to main menu", function() {
		optsMenu.enabled = false;
		mainMenu.enabled = true;

		mainList.appendSprite(mainMenu);
	});
	oMenu.newOption(oMenuBack);
	oMenu.center(canvas, renderingContext);

	optsMenu.appendSprite(oMenu);

// Credits ////////////////////////////////////////////////////////////////////
	credits.enabled = false;

	cBackground = new Sprite("background.jpg", function(x, y) { });
	cBackground.zIndex = -1;
	credits.appendSprite(cBackground);

	cBox = new MessageBox(0, 0, "Credits",
		"Programmers\nConnor Wood\nCameron Kyle-Davidson\n\nArtwork\nLydia Pauly\n\nGame Design\nBen Williams");

	cBoxBack = new MenuOption("Back", function() {
		credits.enabled = false;
		mainMenu.enabled = true;

		mainList.appendSprite(mainMenu);
	});
	cBox.newOption(cBoxBack);

	cBox.closable = false;
	cBox.open = true;
	cBox.center(canvas, renderingContext);
	credits.appendSprite(cBox);

// High Score /////////////////////////////////////////////////////////////////
	highScore.enabled = false;

	hBackground = new Sprite("background.jpg", function(x, y) { });
	hBackground.zIndex = -1;
	highScore.appendSprite(hBackground);

	hScore = new MessageBox(0, 0, "High Score", currentHighScore.get().toString());

	currentHighScore.onChange(function(value) {
		hScore.message = value.toString();
	});

	hScoreBack = new MenuOption("Back", function() {
		highScore.enabled = false;
		mainMenu.enabled = true;

		mainList.appendSprite(mainMenu);
	});
	hScore.newOption(hScoreBack);

	hScore.closable = false;
	hScore.open = true;
	hScore.center(canvas, renderingContext);
	highScore.appendSprite(hScore);

// Game Over //////////////////////////////////////////////////////////////////
	gameOver.enabled = false;

	// TODO: This will need writing properly, once the animation images come through
	goBackground = new Sprite("background.jpg", function(x, y) { });
	goBackground.zIndex = -1;
	gameOver.appendSprite(goBackground);

	gameOverBox = new MessageBox(0, 0, "Game Over", "Oh dear, you are dead.");
	gameOverBox.closable = false;
	gameOverBox.open = true;

	gameOverButton = new MenuOption("Back to Main Menu", function() {
		gameOver.enabled = false;
		mainMenu.enabled = true;

		mainList.appendSprite(mainMenu);

		if(score.get() > currentHighScore.get()) {
			currentHighScore.set(score.get());
		}

		score.set(0);
		lives.set(0);
	});

	gameOverBox.newOption(gameOverButton);
	
	gameOverBox.center(canvas, renderingContext);
	gameOver.appendSprite(gameOverBox);

// Other stuff ////////////////////////////////////////////////////////////////
	lives.onChange(function(value) {
		if(value == 0) {
			gamePlay.enabled = false;
			gameOver.enabled = true;

			mainList.appendSprite(gameOver);
			mainList.draw(renderingContext);
				// Force a redraw
		}
	});

	document.addEventListener('keydown', function(event) {
		if(event.keyCode == 37) {
			// LEFT
			list.draw(renderingContext);
		} else if(event.keyCode == 39) {
			// RIGHT
			list.draw(renderingContext);
		} else if(event.keyCode == 38) {
			// UP
			list.draw(renderingContext);
		} else if(event.keyCode == 40) {
			// DOWN
			list.draw(renderingContext);
		}
	});

	canvas.addEventListener('mousemove', function(event) {
		var localCoords = pageToLocalCoords(event.clientX, event.clientY);

		mainList.onMouseHover(localCoords.x, localCoords.y);
		mainList.draw(renderingContext);
	});

	canvas.addEventListener('mouseleave', function(event) {
		mainList.onMouseOut();
		mainList.draw(renderingContext);
	});

	canvas.addEventListener('click', function(event) {
		var localCoords = pageToLocalCoords(event.clientX, event.clientY);

		mainList.onMouseClick(localCoords.x, localCoords.y);
		mainList.draw(renderingContext);
	});

	mainList.draw(renderingContext);
	setInterval(function() {
		mainList.draw(renderingContext);
	}, 50);
}
