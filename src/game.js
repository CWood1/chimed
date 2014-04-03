function Reactive(initial) {
	this.value = initial;
	this.callbacks = [];

	this.set = function(value) {
		if(value !== this.value) {
			this.value = value;

			for(var i = 0; i < this.callbacks.length; i++) {
				this.callbacks[i](value);
			}
		}
	};

	this.get = function() {
		return this.value;
	};

	this.onChange = function(callback) {
		this.callbacks.push(callback);
	};

	this.offChange = function(callback) {
		for(var i = 0; i < this.callbacks.length; i++) {
			if(this.callbacks[i] == callback) {
				this.callbacks.splice(i, 1);
			}
		}
	};
}

function getCookie(name, defaultValue) {
	cookies = document.cookie.split(';');
		// Get an array of all cookies
	
	for(var i = 0; i < cookies.length; i++) {
		while(cookies[i].charAt(0) == ' ') {
			cookies[i] = cookies[i].substring(1, cookies[i].length);
		}

		if(cookies[i].indexOf(name) == 0) {
			return cookies[i].substring(name.length + 1, cookies[i].length);
				// Add 1, for the =
		}
	}

	return defaultValue;
}

var sound = new Reactive(true);
var music = new Reactive(true);
var score = new Reactive(0);
var lives = new Reactive(0);
var currentHighScore = new Reactive(0);
var highScoreOwner = new Reactive("Nobody");
var scoreMultiplier = 0;
var spawnRate = 0;
var ttlMultiplier = 1;
var tthMultiplier = 1;
var busy = false;

var canvasWidth = 0;
var canvasHeight = 0;

function pageToLocalCoords(x, y) {
	var canvas = document.getElementById("mainGame");
	
	var locX = x - canvas.offsetLeft;
	var locY = y - canvas.offsetTop;
	
	return {x : locX,
		y : locY};
}

function checkSoundSupport() {
	var audio = new Audio();

	if(audio.canPlayType('audio/ogg; codecs="vorbis"') !== "") {
		return 1;
	} else if(audio.canPlayType('audio/mp3') !== "") {
		return 2;
	} else {
		// Give up
		return -1;
	}
}

function Sound(file) {
	if(checkSoundSupport() == 1) {
		file += ".ogg";
	} else if(checkSoundSupport() == 2) {
		file += ".mp3";
	}

	return new Audio(file);
		// Hahaha audiophile xD
}

function Music(file) {
	this.audio = new Sound(file);
	this.playing = true;

	var that = this;
		// Used for the callback

	this.play = function() {
		if(music.get()) {
			this.audio.play();
			this.playing = true;
		}
	};

	this.stop = function() {
		this.audio.pause();
		this.playing = false;
	};

	this.audio.addEventListener('ended', function() {
		this.currentTime = 0;

		if(music) {
			this.play();
		}
	}, false);

	music.onChange(function(value) {
		if(value === true) {
			that.audio.currentTime = 0;

			if(this.playing) {
				that.audio.play();
			}
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
		var audio = new Sound(file);	
		audio.play();

		sound.onChange(function(value) {
			if(value === false) {
				audio.pause();
			}
				// No onchange to true, as by that time, the sound will have gone
		});
	}
}

function Sprite(image, onMouseClick) {
	var that = this;

	this.x = 0;
	this.y = 0;
	this.zIndex = 0;

	this.loaded = false;
	this.enabled = true;

	this.image = new Image();
	this.image.onload = function() {
		that.loaded = true;
	};

	this.image.src = image;	// Save the image itself

	// Methods
	this.draw = function(renderingContext) {
		if(!this.loaded) {
			return;
		}

		renderingContext.drawImage(this.image, this.x, this.y);
	};
	
	this.checkMouse = function(x, y) {
		if(this.x <= x && this.y <= y && this.x + this.image.width >= x && this.y + this.image.height >= y) {
			return true;
		} else {
			return false;
		}
	};
	
	this.onMouseHover = function(x, y) {

	};

	this.onMouseClick = onMouseClick;

	this.onMouseOut = function() {

	};
}

function Animation(continuable, auto) {
	if(typeof(continuable) === 'undefined') {
		continuable = true;
	}

	if(typeof(auto) === 'undefined') {
		auto = true;
	}

	var that = this;

	this.enabled = true;
	this.zIndex = 0;

	this.slides = [];
	this.activeSlide = 0;

	this.onCompleteC = [];

	this.continuable = continuable;
	this.auto = auto;

	this.interval = {};

	this.skip = new Sprite("Buttons/Skip.png", function(x, y) {
		that.complete();
	});
	this.cont = new Sprite("Buttons/Next.png", function(x, y) {
		that.nextFrame();
	});

	this.complete = function() {
		if(this.auto) {
			clearTimeout(this.interval);
		}

		for(var i = 0; i < this.onCompleteC.length; i++) {
			this.onCompleteC[i]();
		}
	};

	this.nextFrame = function() {
		if(this.auto) {
			clearTimeout(this.interval);
		}
		changeSlides();
	};

	this.addSlide = function(slide, duration) {
		var newSlide = slide;
		newSlide.duration = duration;

		this.slides.push(newSlide);
	};

	this.onComplete = function(callback) {
		this.onCompleteC.push(callback);
	};

	this.draw = function(renderingContext) {
		this.slides[this.activeSlide].draw(renderingContext);

		this.skip.x = this.slides[this.activeSlide].image.width - this.skip.image.width;
		this.skip.y = this.slides[this.activeSlide].image.height - this.skip.image.height;

		this.skip.draw(renderingContext);

		if(this.continuable) {
			this.cont.x = this.slides[this.activeSlide].image.width - (this.skip.image.width + this.cont.image.width);
			this.cont.y = this.slides[this.activeSlide].image.height - this.cont.image.height;

			this.cont.draw(renderingContext);
		}
	};

	this.checkMouse = function(x, y) {
		return this.slides[this.activeSlide].checkMouse(x, y);
	};

	this.onMouseHover = function(x, y) {
		if(this.skip.checkMouse(x, y)) {
			this.skip.onMouseHover(x, y);
		} else if(this.continuable && this.cont.checkMouse(x, y)) {
			this.cont.onMouseHover(x, y);
		} else {
			this.slides[this.activeSlide].onMouseHover(x, y);
		}
	};

	this.onMouseClick = function(x, y) {
		if(this.skip.checkMouse(x, y)) {
			this.skip.onMouseClick(x, y);
		} else if(this.continuable && this.cont.checkMouse(x, y)) {
			this.cont.onMouseClick(x, y);
		} else {
			this.slides[this.activeSlide].onMouseClick(x, y);
		}
	};

	this.onMouseOut = function() {
		this.skip.onMouseOut();
		this.cont.onMouseOut();
		this.slides[this.activeSlide].onMouseOut();
	};

	function changeSlides() {
		that.activeSlide++;

		if(that.activeSlide >= that.slides.length) {
			that.complete();
		} else if(that.auto) {
			that.interval = setTimeout(changeSlides, that.slides[that.activeSlide].duration);
		}
	}

	this.start = function() {
		this.activeSlide = 0;

		if(this.slides.length !== 0 && this.auto) {
			this.interval = setTimeout(changeSlides, this.slides[this.activeSlide].duration);
		}
	};
}

function Timer(startTime, scale) {
	if(typeof(scale) === 'undefined') {
		scale = 1;
	}

	this.enabled = true;
	this.zIndex = 0;

	this.paused = false;

	this.time = startTime;
	this.initial = startTime;
	this.onSecondC = [];
	this.onTimeoutC = [];

	this.x = 0;
	this.y = 0;
	this.radius = 20*scale;

	this.fontSize = 10*scale;
	this.colour = false;

	this.interval = {};

	this.draw = function(renderingContext) {
		renderingContext.strokeStyle = "black";

		if(this.colour) {
			renderingContext.fillStyle = this.colour;
		} else if(this.time > 15) {
			renderingContext.fillStyle = "green";
		} else if(this.time > 10) {
			renderingContext.fillStyle = "orange";
		} else {
			renderingContext.fillStyle = "red";
		}

		if(this.paused) {
			renderingContext.fillStyle = "#00A0FF";
		}

		renderingContext.beginPath();
		renderingContext.arc(this.x, this.y, this.radius,
				0, Math.PI * 2, false);
		renderingContext.fill();
		renderingContext.stroke();

		var theta = Math.PI * this.time / 30;
		renderingContext.save();

		renderingContext.translate(this.x, this.y);
		renderingContext.rotate(theta);

		renderingContext.beginPath();
		renderingContext.moveTo(0, 0.1*this.radius);
		renderingContext.lineTo(0, -0.9*this.radius);
		renderingContext.stroke();

		renderingContext.restore();

		renderingContext.font = this.fontSize + "pt Dnk";
		var textX = this.x - renderingContext.measureText(this.time.toString()).width/2;
		var textY = this.y - 2*this.radius;

		renderingContext.fillStyle = "black";

		renderingContext.fillText(this.time.toString(), textX, textY + this.fontSize);
	};

	this.checkMouse = function(x, y) {
		var tmpX = x - (this.x + this.radius);
		var tmpY = y - (this.y + this.radius);

		if(tmpX*tmpX + tmpY*tmpY <= this.radius*this.radius) {
			return true;
		} else {
			return false;
		}
	};

	this.onMouseHover = function(x, y) {

	};

	this.onMouseOut = function() {
		
	};

	this.onMouseClick = function(x, y) {

	};

	this.onSecond = function(callback) {
		this.onSecondC.push(callback);
	};

	this.onTimeout = function(callback) {
		this.onTimeoutC.push(callback);
	};

	this.start = function() {
		var that = this;
		this.paused = false;
		this.interval = setInterval(function() {
			that.time--;

			for(var i = 0; i < that.onSecondC.length; i++) {
				that.onSecondC[i](that.time);
			}

			if(that.time === 0) {
				clearInterval(that.interval);
				that.enabled = false;

				for(var i = 0; i < that.onTimeoutC.length; i++) {
					that.onTimeoutC[i]();
				}
			}
		}, 1000);
	};

	this.stop = function() {
		clearInterval(this.interval);
		this.paused = true;
	};

	this.getTime = function() {
		return this.time;
	};

	this.getDiff = function() {
		return this.initial - this.time;
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

	this.options = [];
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
	this.close = function() {
		while(this.options.length > 0) {
			var opt = this.options.pop();

			if(opt.subMenu !== false) {
				opt.subMenu.close();
			}
		}

		this.open = false;
		this.enabled = false;
	};

	this.newOption = function(option) {
		this.options.push(option);
		this.height += 2*this.border + this.oneElHeight;
	};

	this.draw = function(renderingContext) {
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

			if(this.options[i].hover && this.options[i].subMenu !== false) {
				this.options[i].subMenu.draw(renderingContext);
			}
		}
	};

	this.center = function(renderingContext) {
		this.computeDimensions(renderingContext);

		this.x = (canvasWidth / 2) - (this.width / 2);
		this.y = (canvasHeight / 2) - (this.oneElHeight * this.options.length / 2);
	};

	this.computeDimensions = function(renderingContext) {
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
	};
	
	this.checkMouse = function(x, y) {
		if(!this.open) {
			return false;
		}

		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			return true;
		} else {
			for(var i = 0; i < this.options.length; i++) {
				if(this.options[i].subMenu !== false && this.options[i].hover) {
					return this.options[i].subMenu.checkMouse(x, y);
				}
			}
			
			return false;
		}
	};

	this.onMouseHover = function(x, y) {
		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			var yOff = y - this.y;

			for(var i = 0; i < this.options.length; i++) {
				if(yOff >= i*this.oneElHeight + 2*i*this.border && yOff < i*this.oneElHeight + this.oneElHeight + 2*i*this.border + 2*this.border) {
					this.options[i].hover = true;

					if(this.options[i].subMenu !== false && this.options[i].active) {
						this.options[i].subMenu.onMouseOut();
						this.options[i].subMenu.x = this.x + this.width + 2*this.border;
						this.options[i].subMenu.y = this.y + i*this.oneElHeight + 2*i*this.border;
						this.options[i].subMenu.open = true;
					}
				} else {
					this.options[i].hover = false;

					if(this.options[i].subMenu !== false) {
						this.options[i].subMenu.onMouseOut();
						this.options[i].subMenu.open = false;	// We can't call close here, as it removes all options from the menu
					}

				}
			}
		} else {
			for(var i = 0; i < this.options.length; i++) {
				if(this.options[i].hover && this.options[i].subMenu !== false) {
					this.options[i].subMenu.onMouseHover(x, y);
				}
			}
		}
	};

	this.onMouseClick = function(x, y) {
		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			for(var i = 0; i < this.options.length; i++) {
				if(this.options[i].hover && this.options[i].active) {
					this.options[i].action();
					break;
				}
			}
		} else {
			for(var i = 0; i < this.options.length; i++) {
				if(this.options[i].hover && this.options[i].subMenu !== false) {
					this.options[i].subMenu.onMouseClick(x, y);
				}
			}
		}

		if(this.autoClose) {
			this.close();
		}
	};

	this.onMouseOut = function() {
		for(var i = 0; i < this.options.length; i++) {
			this.options[i].hover = false;

			if(this.options[i].subMenu !== false) {
				this.options[i].subMenu.onMouseOut();
				this.options[i].subMenu.open = false;
			}
		}
	};
}

function MessageBox(x, y, titleText, message, scale) {
	if(typeof(scale) === 'undefined') {
		scale = 1;
	}

	this.message = message;
	this.titleText = titleText;
	this.options = [];

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

	this.buttonWidth = 0;

	// Methods
	this.close = function() {
		this.open = false;
		this.enabled = false;
	};

	this.newOption = function(option) {
		this.options.push(option);
	};

	this.draw = function(renderingContext) {
		if(!this.open) {
			return;
		}

		this.computeDimensions(renderingContext);

		renderingContext.beginPath();
		renderingContext.strokeStyle = "black";
		renderingContext.font = this.fontSize + "px Dnk";

		var lines = this.message.split("\n");

		renderingContext.fillStyle = "#0000FF";

		renderingContext.strokeRect(this.x, this.y, this.width, 2*this.border + this.lineHeight);
		renderingContext.fillRect(this.x + this.border, this.y + this.border,
				this.width - 2*this.border, this.lineHeight);
			// Create the title box
		renderingContext.fillStyle = "white";
		renderingContext.fillText(this.titleText,
				this.x + ((this.width - (this.closable ? this.lineHeight : 0)) / 2) -
					(renderingContext.measureText(this.titleText).width / 2),
				this.y + this.border + this.fontSize);
			// Add the text to the title box

		if(this.closable) {
			renderingContext.fillStyle = "#FF0000";
			
			renderingContext.fillRect(this.x + this.width - (this.lineHeight + this.border),
					this.y + this.border, this.lineHeight, this.lineHeight);
				// Create the close button, if it's needed
		}

		renderingContext.fillStyle = "#0000FF";

		renderingContext.strokeRect(this.x, this.y + this.border + this.lineHeight,
				this.width, lines.length*this.lineHeight + 2*this.border);
		renderingContext.fillRect(this.x + this.border, this.y + 2*this.border + this.lineHeight,
				this.width - 2*this.border, lines.length*this.lineHeight);
			// Create the main box

		renderingContext.fillStyle = "white";
		for(var i = 0; i < lines.length; i++) {
			renderingContext.fillText(lines[i], this.x + (this.width / 2) -
						(renderingContext.measureText(lines[i]).width / 2),
					this.y + this.fontSize + 2*this.border + this.lineHeight*(i+1));
				// Add the text to the main box
		}

		if(this.options.length !== 0) {
			renderingContext.fillStyle = "#0000FF";

			renderingContext.strokeRect(this.x, this.y + this.height -
						(6*this.border + this.lineHeight),
					this.width, 6*this.border + this.lineHeight);
			renderingContext.fillRect(this.x + this.border, this.y + this.height -
						(5*this.border + this.lineHeight),
					this.width - 2*this.border, 4*this.border + this.lineHeight);
				// Create the button box

			var widthSoFar = 0;
			for(var i = 0; i < this.options.length; i++) {
				var itemWidth = renderingContext.measureText(this.options[i].text).width;

				this.options[i].x = this.x + widthSoFar + (this.width / 2) - (this.buttonWidth / 2);
					// Center the buttons
				this.options[i].y = this.y + this.height - (4*this.border + this.lineHeight);
					// One border below the top of the box
				this.options[i].width = 4*this.border + itemWidth;
				this.options[i].height = this.lineHeight + 2*this.border;

				renderingContext.strokeRect(this.options[i].x, this.options[i].y,
						this.options[i].width, this.options[i].height);
					// Draw the button

				if(this.options[i].hover) {
					renderingContext.fillStyle = "#0000AA";

					renderingContext.fillRect(this.options[i].x + this.border,
							this.options[i].y + this.border,
							this.options[i].width - 2*this.border,
							this.options[i].height - 2*this.border);
						// If applicable, fill in the button
				}

				renderingContext.fillStyle = "white";
				renderingContext.fillText(this.options[i].text,
						this.options[i].x + this.border,
						this.options[i].y + this.fontSize);
					// Write the text

				widthSoFar += this.options[i].width;
			}
		}
	};

	this.center = function(renderingContext) {
		this.computeDimensions(renderingContext);
		this.x = (canvasWidth / 2) - (this.width / 2);
		this.y = (canvasHeight / 2) - (this.height / 2);
	};

	this.computeDimensions = function(renderingContext) {
		this.width = 0;
		this.height = 0;

		renderingContext.beginPath();
		renderingContext.strokeStyle = "black";
		renderingContext.font = this.fontSize + "px Dnk";

		var lines = this.message.split("\n");

		// Width calculations //////////////////////////////////////////////////////////////////////////
		for(var i = 0; i < lines.length; i++) {
			if(renderingContext.measureText(lines[i]).width + 4*this.border > this.width) {
				this.width = renderingContext.measureText(lines[i]).width + 4*this.border;
			}
		}

		if(renderingContext.measureText(this.titleText).width + (this.closable ? this.lineHeight : 0) +
				4*this.border > this.width) {
			this.width = renderingContext.measureText(this.titleText).width +
				(this.closable ? this.lineHeight : 0) + 4*this.border;
		}

		if(this.options.length !== 0) {
			var cur = 4*this.border;

			for(var i = 0; i < this.options.length; i++) {
				cur += 5*this.border + renderingContext.measureText(this.options[i].text).width;
			}

			if(cur > this.width) {
				this.width = cur;
			}

			this.buttonWidth = cur - 4*this.border;
		}

		// Height calculations /////////////////////////////////////////////////////////////////////////
		this.height = 2*this.border + this.lineHeight;
		this.height += this.border + lines.length * this.lineHeight;
		this.height += 5*this.border + this.lineHeight;
	};

	this.checkMouse = function(x, y) {
		if(!this.open) {
			return false;
		}

		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			return true;
		} else {
			return false;
		}
	};

	this.onMouseHover = function(x, y) {
		for(var i = 0; i < this.options.length; i++) {
			if(x >= this.options[i].x && x <= this.options[i].x + this.options[i].width &&
					y >= this.options[i].y && y <= this.options[i].y + this.options[i].height) {
				this.options[i].hover = true;
			} else {
				this.options[i].hover = false;
			}
		}
	};

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
	};

	this.onMouseOut = function(x, y) {
		for(var i = 0; i < this.options.length; i++) {
			this.options[i].hover = false;
		}
	};
}

function SpriteList() {
	this.list = [];

	this.currentHover = false;
	this.enabled = true;

	this.zIndex = 0;

	this.activeMenu = false;

	// Methods
	this.appendSprite = function(sprite) {
		this.list.push(sprite);

		this.list.sort(function(a, b) {	// Ensure that we're sorted by the zIndex of the sprites
			return a.zIndex - b.zIndex;
		});
	};

	this.draw = function(renderingContext) {
		for(var i = 0; i < this.list.length; i++) {
			if(this.list[i].enabled === false) {
				this.list.splice(i, 1);
			} else {
				this.list[i].draw(renderingContext);
			}
		}

		if(this.activeMenu !== false) {
			this.activeMenu.draw(renderingContext);
		}
	};

	this.checkMouse = function(x, y) {
		if(this.activeMenu !== false && this.activeMenu.checkMouse(x, y) !== false) {
			return this.activeMenu;
		}

		for(var i = this.list.length - 1; i >= 0; i--) {
			// Traverse the list backwards, because zIndex
			if(this.list[i].enabled && this.list[i].checkMouse(x, y) !== false) {
				return this.list[i];
			}
		}
		
		return false;
	};

	this.onMouseHover = function(x, y) {
		if(this.currentHover === false || this.currentHover.enabled === false) {
			this.currentHover = this.checkMouse(x, y);

			if(this.currentHover === false) {
				return;	// Give up and go home
			}
		} else {
			if(this.currentHover != this.checkMouse(x, y)) {
				this.currentHover.onMouseOut();
				this.currentHover = this.checkMouse(x, y);

				if(this.currentHover === false) {
					return;	// Give up and go home
				}
			}
		}

		this.currentHover.onMouseHover(x, y);
	};

	this.onMouseOut = function() {
		if(this.currentHover !== false) {
			this.currentHover.onMouseOut();

			this.currentHover = false;
		}
	};

	this.onMouseClick = function(x, y) {
		if(this.currentHover !== false) {
			if(this.activeMenu !== false && this.activeMenu.open && this.currentHover != this.activeMenu) {
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
		} else if(this.activeMenu !== false && this.activeMenu.open) {
			this.activeMenu.close();
			this.activeMenu = false;
		}
	};
}

function Patient(x, y) {
	var that = this;

	this.enabled = true;
	this.zIndex = 5;
		// Defaults, to allow this to function as a sprite
	
	this.x = x;
	this.y = y;

	this.healing = false;

	this.timerLive = {};
	this.timerHeal = {};

	this.scoreMultiplier = 1;

	this.type = Math.floor(Math.random() * 3);
	if(this.type == 3) {
		this.type = 2;
	}

	patientString = "Sprites/Victims/";

	switch(this.type) {
		case 0:
			patientString += "Burn_Victim.png";

			this.timerLive = new Timer(Math.ceil(30*ttlMultiplier));
			this.timerHeal = new Timer(Math.ceil(4*tthMultiplier));
			this.scoreMultiplier = 1;

			break;
		case 1:
			patientString += "Trauma_Victim.png";

			this.timerLive = new Timer(Math.ceil(24*ttlMultiplier));
			this.timerHeal = new Timer(Math.ceil(6*tthMultiplier));
			this.scoreMultiplier = 1.2;

			break;
		case 2:
			patientString += "Sick_Victim.png";

			this.timerLive = new Timer(Math.ceil(18*ttlMultiplier));
			this.timerHeal = new Timer(Math.ceil(8*tthMultiplier));
			this.scoreMultiplier = 1.4;

			break;
	}

	this.sprite = new Sprite(patientString, function(x, y) {
		if(!busy) {
			that.timerLive.stop();
			that.timerHeal.start();

			busy = that;
			that.healing = true;
		}
	});

	this.healingSprite = new Sprite("Sprites/Doctor_Treating_Sign.png", function(x, y) {
		that.healing = false;
		that.timerHeal.stop();

		that.timerLive.time += that.timerHeal.getDiff();
		that.timerLive.start();

		busy = false;
	});

	this.timerLive.onTimeout(function() {
		that.enabled = false;
		lives.set(lives.get() - 1);

		if(busy == this) {
			busy = false;
		}
	});

	this.timerHeal.onTimeout(function() {
		that.enabled = false;
		busy = false;

		score.set(Math.floor(score.get() + that.timerLive.getTime() * scoreMultiplier * that.scoreMultiplier));
	});

	this.timerHeal.colour = "green";

	this.timerLive.start();

	this.draw = function(renderingContext) {
		if(this.healing) {
			this.timerHeal.x = this.x + this.sprite.image.width - this.timerHeal.radius/2;
			this.timerHeal.y = this.y + this.sprite.image.height/2;

			this.timerHeal.draw(renderingContext);

			renderingContext.font = "15px Dnk";
			renderingContext.fillText("Time", this.x, this.y + this.sprite.image.height/2);
			renderingContext.fillText("to heal", this.x, this.y + this.sprite.image.height/2 + 20);

			this.healingSprite.x = this.x + (this.sprite.image.width / 2) - (this.healingSprite.image.width / 2);
			this.healingSprite.y = this.y + this.sprite.image.height / 2 + 60;

			this.healingSprite.draw(renderingContext);
		} else {
			this.timerLive.x = this.x + this.sprite.image.width - this.timerLive.radius * 2;
			this.timerLive.y = this.y + this.timerLive.radius;

			this.sprite.x = this.x;
			this.sprite.y = this.y + 50;

			this.sprite.draw(renderingContext);
			this.timerLive.draw(renderingContext);
	
			renderingContext.font = "15px Dnk";
			renderingContext.fillText("Time", this.x, this.y + this.timerLive.radius);
			renderingContext.fillText("to live", this.x, this.y + this.timerLive.radius + 20);
		}
	};

	this.checkMouse = function(x, y) {
		if(this.healing) {
			return this.healingSprite.checkMouse(x, y) || this.timerHeal.checkMouse(x, y);
		} else {
			return this.sprite.checkMouse(x, y) || this.timerLive.checkMouse(x, y);
		}
	};

	this.onMouseHover = function(x, y) {
		if(this.healing) {
			if(this.healingSprite.checkMouse(x, y)) {
				this.healingSprite.onMouseHover(x, y);
			} else if(this.timerHeal.checkMouse(x, y)) {
				this.timerHeal.onMouseHover(x, y);
			}
		} else {
			if(this.sprite.checkMouse(x, y)) {
				this.sprite.onMouseHover(x, y);
			} else if(this.timerLive.checkMouse(x, y)) {
				this.timerLive.onMouseHover(x, y);
			}
		}
	};

	this.onMouseClick = function(x, y) {
		if(this.healing) {
			if(this.healingSprite.checkMouse(x, y)) {
				this.healingSprite.onMouseClick(x, y);
			} else if(this.timerHeal.checkMouse(x, y)) {
				this.timerHeal.onMouseClick(x, y);
			}
		} else {
			if(this.sprite.checkMouse(x, y)) {
				this.sprite.onMouseClick(x, y);
			} else if(this.timerLive.checkMouse(x, y)) {
				this.timerLive.onMouseClick(x, y);
			}
		}
	};

	this.onMouseOut = function() {
		this.sprite.onMouseOut();
		this.timerLive.onMouseOut();
		this.healingSprite.onMouseOut();
		this.timerHeal.onMouseOut();
	};
}

function Ward() {
	this.backgrounds = [
		new Sprite("play_backgrounds/0.jpg", function(x, y) { }),
		new Sprite("play_backgrounds/1.jpg", function(x, y) { }),
		new Sprite("play_backgrounds/2.jpg", function(x, y) { }),
		new Sprite("play_backgrounds/3.jpg", function(x, y) { }),
		new Sprite("play_backgrounds/4.jpg", function(x, y) { }),
		new Sprite("play_backgrounds/5.jpg", function(x, y) { }),
		new Sprite("play_backgrounds/6.jpg", function(x, y) { }),
		new Sprite("play_backgrounds/7.jpg", function(x, y) { })];
	this.activeBackground = 0;

	this.enabled = true;
	this.zIndex = 0;

	this.patients = [false, false, false];

	this.draw = function(renderingContext) {
		this.activeBackground = 0;

		if(this.patients[0] && !this.patients[0].healing) {
			this.activeBackground += 4;
		}

		if(this.patients[1] && !this.patients[1].healing) {
			this.activeBackground += 2;
		}

		if(this.patients[2] && !this.patients[2].healing) {
			this.activeBackground += 1;
		}

		this.backgrounds[this.activeBackground].draw(renderingContext);

		for(var i = 0; i < this.patients.length; i++) {
			if(this.patients[i] !== false && this.patients[i].enabled) {
				this.patients[i].draw(renderingContext);
			} else if(this.patients[i]) {
				this.patients[i] = false;
					// If it is disabled, remove it from the list
					// Do not schedule a patient twice
				this.schedulePatient(i);
			}
		}
	};

	this.checkMouse = function(x, y) {
		return this.backgrounds[this.activeBackground].checkMouse(x, y);
	};

	this.onMouseHover = function(x, y) {
		for(var i = 0; i < this.patients.length; i++) {
			if(this.patients[i]) {
				if(this.patients[i].checkMouse(x, y)) {
					this.patients[i].onMouseHover(x, y);
					this.backgrounds[this.activeBackground].onMouseOut(x, y);
				} else {
					this.patients[i].onMouseOut(x, y);
				}
			}
		}

		if(this.backgrounds[this.activeBackground].checkMouse(x, y)) {
			this.backgrounds[this.activeBackground].onMouseHover(x, y);
		}
	};

	this.onMouseClick = function(x, y) {
		for(var i = 0; i < this.patients.length; i++) {
			if(this.patients[i] && this.patients[i].checkMouse(x, y)) {
				this.patients[i].onMouseClick(x, y);
				return;
			}
		}

		if(this.backgrounds[this.activeBackground].checkMouse(x, y)) {
			this.backgrounds[this.activeBackground].onMouseClick(x, y);
		}
	};
	
	this.onMouseOut = function() {
		for(var i = 0; i < this.patients.length; i++) {
			if(this.patients[i])
				this.patients[i].onMouseOut();
		}

		this.backgrounds[this.activeBackground].onMouseOut();
	};

	var that = this;
	this.schedulePatient = function(n) {
		setTimeout(function() {
			that.createPatient(n);
		}, Math.floor(Math.random() * spawnRate) * 1000);
	};

	this.createPatient = function(n) {
		var p;

		switch(n) {
			case 0:
				p = new Patient(35, 125);
				break;
			case 1:
				p = new Patient(245, 125);
				break;
			case 2:
				p = new Patient(465, 125);
				break;
		}

		this.patients[n] = p;
	};
}

function runGame() {
	currentHighScore.set(getCookie("HighScore", 0));
	highScoreOwner.set(getCookie("ScoreOwner", "Nobody"));
	var canvas = document.getElementById("mainGame");
	var renderingContext = canvas.getContext("2d");

	canvasWidth = canvas.width;
	canvasHeight = canvas.height;

	var backgroundMusic = new Music("Montauk Point");
	var introMusic = new Music("Hush");
	var gameplayMusic = new Music("Hush");
		// TBD
	var gameoverMusic = new Music("Plaint");

	introMusic.stop();
	gameplayMusic.stop();
	gameoverMusic.stop();

	var mainList = new SpriteList();

	var mainMenu = new SpriteList();
	var diffMenu = new SpriteList();
	var gamePlay = new SpriteList();
	var credits = new SpriteList();
	var highScore = new SpriteList();
	var startScene = new SpriteList();
	var gameOver = new SpriteList();
	var tutorial = new SpriteList();

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

		mainList.appendSprite(diffMenu);
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
	mmMenu.newOption(mmMenuOptCredits);
	mmMenu.newOption(mmMenuOptHighScore);

	mmMenu.zIndex = 100;
	mmMenu.open = true;
	mmMenu.center(renderingContext);
	mainMenu.appendSprite(mmMenu);

	mainList.appendSprite(mainMenu);

// Starting Cutscene //////////////////////////////////////////////////////////
	startScene.enabled = false;

	var intro = new Animation(true, false);

	var slide1 = new Sprite("Start_Slide_First.jpg", function(x, y) {

	});

	var slide2 = new Sprite("Start_Slide_Second.jpg", function(x, y) {

	});

	var slide3 = new Sprite("Start_Slide_Third.jpg", function(x, y) {

	});

	intro.addSlide(slide1, 1500);
	intro.addSlide(slide2, 1500);
	intro.addSlide(slide3, 1500);

	intro.zIndex = 100;
	intro.onComplete(function() {
		startScene.enabled = false;
		gamePlay.enabled = true;

		ward.createPatient(0);
		ward.schedulePatient(1);
		ward.schedulePatient(2);

		mainList.appendSprite(gamePlay);

		introMusic.stop();
		gameplayMusic.play();
	});

	startScene.appendSprite(intro);

// Gameplay ///////////////////////////////////////////////////////////////////
	gamePlay.enabled = false;

	var scoreBox = new MessageBox(0, 0, "Current Score", score.get().toString());
	scoreBox.closable = false;
	scoreBox.open = true;

	score.onChange(function(value) {
		scoreBox.message = value.toString();
	});

	gamePlay.appendSprite(scoreBox);

	var livesBox = new MessageBox(0, 0, "Lives", score.get().toString());
	livesBox.closable = false;
	livesBox.open = true;

	lives.onChange(function(value) {
		livesBox.message = value.toString();
	});

		// Calculate the width
	livesBox.computeDimensions(renderingContext);
	livesBox.y = 0;
	livesBox.x = canvasWidth - livesBox.width;

	gamePlay.appendSprite(livesBox);

	var ward = new Ward();
	gamePlay.appendSprite(ward);

// Difficulty menu ////////////////////////////////////////////////////////////
	diffMenu.enabled = false;
	
	var diffBackground = new Sprite("background.jpg", function(x, y) { });
	diffBackground.zIndex = -5;
	diffMenu.appendSprite(diffBackground);
	
	var dMenu = new Menu(0, 0, 1.5);
	dMenu.autoClose = false;
	dMenu.open = true;
	
	var dMenuEasy = new MenuOption("Easy", function(){
		scoreMultiplier = 1;
		spawnRate = 5;
		lives.set(10);
		ttlMultiplier = 1;
		tthMultiplier = 1;
			// These will need balancing

		diffMenu.enabled = false;
		startScene.enabled = true;

		mainList.appendSprite(startScene);
		intro.start();
		
		backgroundMusic.stop();
		introMusic.play();
	});
	var dMenuMed = new MenuOption("Medium", function(){
		scoreMultiplier = 1.3;
		spawnRate = 3;
		lives.set(7);
		ttlMultiplier = 0.8;
		tthMultiplier = 0.8;
			// These will need balancing

		diffMenu.enabled = false;
		startScene.enabled = true;

		mainList.appendSprite(startScene);
		intro.start();

		backgroundMusic.stop();
		introMusic.play();
	});
	var dMenuHard = new MenuOption("Hard", function(){
		scoreMultiplier = 1.5;
		spawnRate = 1;
		lives.set(5);
		ttlMultiplier = 0.5;
		tthMultiplier = 0.5;
			// These will need balancing

		diffMenu.enabled = false;
		startScene.enabled = true;

		mainList.appendSprite(startScene);
		intro.start();

		backgroundMusic.stop();
		introMusic.play();
	});
	var dMenuTutorial = new MenuOption("Tutorial", function() {
		diffMenu.enabled = false;
		tutorial.enabled = true;

		mainList.appendSprite(tutorial);

		tutorialAnimation.start();
	});
	var dMenuRtn = new MenuOption("Return to menu", function(){ 
		diffMenu.enabled = false;
		mainMenu.enabled = true;
		
		mainList.appendSprite(mainMenu);
	});
	
	dMenu.newOption(dMenuEasy);
	dMenu.newOption(dMenuMed);
	dMenu.newOption(dMenuHard);
	dMenu.newOption(dMenuTutorial);
	dMenu.newOption(dMenuRtn);
	
	dMenu.center(renderingContext);
	
	diffMenu.appendSprite(dMenu);

// Options menu ///////////////////////////////////////////////////////////////
	muteButton = new Sprite("Buttons/Mute.png", function(x, y) {
		muteButton.enabled = false;
		unmuteButton.enabled = true;

		sound.set(false);
		music.set(false);

		mainList.appendSprite(unmuteButton);
	});
	unmuteButton = new Sprite("Buttons/Unmute.png", function(x, y) {
		muteButton.enabled = true;
		unmuteButton.enabled = false;

		sound.set(true);
		music.set(true);

		mainList.appendSprite(muteButton);
	});

	muteButton.zIndex = 100;
	unmuteButton.zIndex = 100;

	muteButton.x = 0;
	unmuteButton.x = 0;

	muteButton.y = canvasHeight - muteButton.image.height;
	unmuteButton.y = canvasHeight - unmuteButton.image.height;

	muteButton.enabled = true;
	mainList.appendSprite(muteButton);

// Credits ////////////////////////////////////////////////////////////////////
	credits.enabled = false;

	var cBackground = new Sprite("background.jpg", function(x, y) { });
	cBackground.zIndex = -1;
	credits.appendSprite(cBackground);

	var cBox = new MessageBox(0, 0, "Credits",
		"Programmers\nConnor Wood\nCameron Kyle-Davidson\n\nArtwork\nLydia Pauly\n\nGame Design\nBen Williams");

	var cBoxBack = new MenuOption("Back", function() {
		credits.enabled = false;
		mainMenu.enabled = true;

		mainList.appendSprite(mainMenu);
	});
	cBox.newOption(cBoxBack);

	cBox.closable = false;
	cBox.open = true;
	cBox.center(renderingContext);
	credits.appendSprite(cBox);

// High Score /////////////////////////////////////////////////////////////////
	highScore.enabled = false;

	var hBackground = new Sprite("background.jpg", function(x, y) { });
	hBackground.zIndex = -1;
	highScore.appendSprite(hBackground);

	var hScore = new MessageBox(0, 0, "High Score", highScoreOwner.get() + "\n" +
		       currentHighScore.get().toString());

	currentHighScore.onChange(function(value) {
		hScore.message = highScoreOwner.get() + "\n" +
			value.toString();
	});

	currentHighScore.onChange(function(value) {
		var date = new Date();
		date.setTime(date.getTime() + 100*365*24*60*60*1000);
			// Expires in 100 years time
		document.cookie = "HighScore=" + value.toString() + "; expires=" + date.toGMTString() + "; path=/";
		document.cookie = "ScoreOwner=" + highScoreOwner.get() + "; expires=" + date.toGMTString() + "; path=/";
	});

	score.onChange(function(value) {
		if(currentHighScore.get() < value) {
			currentHighScore.set(value);
		}
	});

	var hScoreBack = new MenuOption("Back", function() {
		highScore.enabled = false;
		mainMenu.enabled = true;

		mainList.appendSprite(mainMenu);
	});
	hScore.newOption(hScoreBack);

	hScore.closable = false;
	hScore.open = true;
	hScore.center(renderingContext);
	highScore.appendSprite(hScore);

// Game Over //////////////////////////////////////////////////////////////////
	gameOver.enabled = false;

	// TODO: This will need writing properly, once the animation images come through
	var goBackground = new Sprite("background.jpg", function(x, y) { });
	goBackground.zIndex = -1;
	gameOver.appendSprite(goBackground);

	var gameOverBox = new MessageBox(0, 0, "Game Over", "Oh dear, you are dead.");
	gameOverBox.closable = false;
	gameOverBox.open = true;

	var gameOverButton = new MenuOption("Back to Main Menu", function() {
		gameOver.enabled = false;
		mainMenu.enabled = true;

		mainList.appendSprite(mainMenu);

		score.set(0);
		lives.set(0);

		gameoverMusic.stop();
		backgroundMusic.play();
	});

	gameOverBox.newOption(gameOverButton);
	
	gameOverBox.center(renderingContext);
	gameOver.appendSprite(gameOverBox);

// Tutorial ///////////////////////////////////////////////////////////////////
	tutorial.enabled = false;

	var tutorialAnimation = new Animation(true, false);

	var tutSlide1 = new Sprite("Tutorial/Tutorial_One.jpg", function(x, y) {

	});
	var tutSlide2 = new Sprite("Tutorial/Tutorial_Two.jpg", function(x, y) {

	});
	var tutSlide3 = new Sprite("Tutorial/Tutorial_Three.jpg", function(x, y) {

	});

	tutorialAnimation.addSlide(tutSlide1, 0);
	tutorialAnimation.addSlide(tutSlide2, 0);
	tutorialAnimation.addSlide(tutSlide3, 0);

	tutorialAnimation.zIndex = 100;
	tutorialAnimation.onComplete(function() {
		tutorial.enabled = false;
		diffMenu.enabled = true;

		mainList.appendSprite(diffMenu);
	});

	tutorial.appendSprite(tutorialAnimation);

// Other stuff ////////////////////////////////////////////////////////////////
	lives.onChange(function(value) {
		if(value === 0) {
			gamePlay.enabled = false;
			gameOver.enabled = true;

			mainList.appendSprite(gameOver);
			mainList.draw(renderingContext);
				// Force a redraw

			gameplayMusic.stop();
			gameoverMusic.play();
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
