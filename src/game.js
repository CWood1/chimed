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
	this.x = 0;				// Store the x and y coordinates
	this.y = 0;
	this.zIndex = 0;		// This is used for image sequencing

	this.image = document.createElement("img");
	this.image.src = image;	// Save the image itself
	document.getElementById("imageStorage").appendChild(this.image);	// Place the image in the DOM

	this.width = this.image.width;
	this.height = this.image.height;

	this.enabled = true;

	// Methods
	this.draw = draw;
	function draw(renderingContext) {
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
		this.enabled = false;

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
		this.skip.draw(renderingContext);
			// This will be drawn over; this is to get the width
		this.slides[this.activeSlide].draw(renderingContext);

		this.cont.x = 0;
		this.cont.y = this.slides[this.activeSlide].height - this.cont.height;

		this.cont.draw(renderingContext);

		this.skip.x = this.slides[this.activeSlide].width - this.skip.width;
		this.skip.y = this.slides[this.activeSlide].height - this.skip.height;

		this.skip.draw(renderingContext);
	}

	this.checkMouse = function(x, y) {
		return this.slides[this.activeSlide].checkMouse(x, y);
	}

	this.onMouseHover = function(x, y) {
		if(this.skip.checkMouse(x, y)) {
			this.skip.onMouseHover(x, y);
		} else if(this.continuable && this.cont.checkMouse(x, y)) {
			this.cont.onMouseHover(x, y);
		} else {
			this.slides[this.activeSlide].onMouseHover(x, y);
		}
	}

	this.onMouseClick = function(x, y) {
		if(this.skip.checkMouse(x, y)) {
			this.skip.onMouseClick(x, y);
		} else if(this.continuable && this.cont.checkMouse(x, y)) {
			this.cont.onMouseClick(x, y);
		} else {
			this.slides[this.activeSlide].onMouseClick(x, y);
		}
	}

	this.onMouseOut = function() {
		this.skip.onMouseOut();
		this.cont.onMouseOut();
		this.slides[this.activeSlide].onMouseOut();
	}

	function changeSlides() {
		that.activeSlide++;

		if(that.activeSlide >= that.slides.length) {
			that.enabled = false;

			for(var i = 0; i < that.onCompleteC.length; i++) {
				that.onCompleteC[i]();
			}
		} else {
			that.interval = setTimeout(changeSlides, that.slides[that.activeSlide].duration);
		}
	}

	this.start = function() {
		if(this.slides.length != 0) {
			this.interval = setTimeout(changeSlides, this.slides[that.activeSlide].duration);
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
			var cur = 2*this.border + 2;

			for(var i = 0; i < this.options.length; i++) {
				cur += 2*this.border + renderingContext.measureText(this.options[i].text).width + 2;
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
			if(renderingContext.measureText(lines[i]).width + 2*this.border + 2 > this.width) {
				this.width = renderingContext.measureText(lines[i]).width + 2*this.border + 2;
			}
		}

		if(renderingContext.measureText(this.titleText).width + this.lineHeight > this.width) {
			this.width = renderingContext.measureText(this.titleText).width + this.lineHeight + 2*this.border;
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

function runGame() {
	var canvas = document.getElementById("mainGame");
	var renderingContext = canvas.getContext("2d");

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
		animation.start();
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

// Gameplay ///////////////////////////////////////////////////////////////////
	gamePlay.enabled = false;

	var background = new Sprite("background.jpg", function(x, y) {

	});

	background.zIndex = -5;
	gamePlay.appendSprite(background);
	
// Difficulty menu ////////////////////////////////////////////////////////////
	diffMenu.enabled = false;
	
	diffBackground = new Sprite("background.jpg", function(x, y) { });
	diffBackground.zIndex = -5;
	diffMenu.appendSprite(diffBackground);
	
	dMenu = new Menu(0, 0, 1.5);
	dMenu.autoClose = false;
	dMenu.open = true;
	
	var dMenuEasy = new MenuOption("Easy", function(){ });
	var dMenuMed = new MenuOption("Medium", function(){ });
	var dMenuHard = new MenuOption("Hard", function(){ });
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
	mainList.appendSprite(diffMenu);

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

	hScore = new MessageBox(0, 0, "High Score", score.get().toString());

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

// Other stuff ////////////////////////////////////////////////////////////////
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
