function addDbgStatus(status) {
	var para = document.createElement("p");
	para.innerHTML = status;
	document.getElementById("debugConsole").appendChild(para);
	return para;
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

	// Methods
	this.draw = draw;
	function draw(renderingContext) {
		renderingContext.drawImage(this.image, this.x, this.y);
	}
	
	this.checkMouse = checkMouse;
	function checkMouse(x, y) {
		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			return 1;
		} else {
			return 0;
		}
	}
	
	this.onMouseHover = onMouseHover;
	function onMouseHover(x, y) {
	//	addDbgStatus(this.image.src + " Mouse Hover Event - " + x + " " + y);
	}

	this.onMouseClick = onMouseClick;

	this.onMouseOut = onMouseOut;
	function onMouseOut() {

	}
}

function MenuOption(text, action) {
	this.text = text;
	this.action = action;
	this.hover = false;
}

function Menu(x, y) {
	this.options = new Array();
	this.zIndex = 100;

	this.x = x;
	this.y = y;
	this.height = 0;
	this.width = 0;

	this.oneElHeight = 20;
	this.fontSize = 15;
	this.border = 1;

	this.open = false;

	// Methods
	this.close = close;
	function close() {
		while(this.options.length > 0) {
			this.options.pop();
		}

		this.open = false;
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
		renderingContext.font = this.fontSize + "px Arial";

		for(var i = 0; i < this.options.length; i++) {
			var dims = renderingContext.measureText(this.options[i].text);
			if(dims.width > this.width) {
				this.width = dims.width;

				this.width += 2*this.border;
			}
		}

		for(var i = 0; i < this.options.length; i++) {
			if(this.options[i].hover) {
				renderingContext.fillStyle = "#0000AA";
			} else {
				renderingContext.fillStyle = "#0000FF";
			}

			renderingContext.fillRect(this.x + this.border, this.y + i*this.oneElHeight + 2*i*this.border + this.border, this.width, this.oneElHeight);
			renderingContext.strokeRect(this.x, this.y + i*this.oneElHeight + 2*i*this.border,
					this.width + 2*this.border, this.oneElHeight + 2*this.border);
			renderingContext.fillStyle = "white";
			renderingContext.fillText(this.options[i].text, this.x + this.border + 1, this.y + 15 + this.border + i*this.oneElHeight + 2*i*this.border);
		}
	};
	
	this.checkMouse = checkMouse;
	function checkMouse(x, y) {
		if(!this.open) {
			return 0;
		}

		if(this.x <= x && this.y <= y && this.x + this.width >= x && this.y + this.height >= y) {
			return 1;
		} else {
			return 0;
		}
	}

	this.onMouseHover = onMouseHover;
	function onMouseHover(x, y) {
		// TODO: there are some positional bugs in here somewhere, confuses the heck out of what is actually active
		var yOff = y - this.y;

		for(var i = 0; i < this.options.length; i++) {
			if(yOff >= i*this.oneElHeight + 2*i*this.border && yOff <= i*this.oneElHeight + this.oneElHeight + 2*i*this.border + 2*this.border) {
				this.options[i].hover = true;
			} else {
				this.options[i].hover = false;
			}
		}
	}

	this.onMouseClick = onMouseClick;
	function onMouseClick(x, y) {
		for(var i = 0; i < this.options.length; i++) {
			if(this.options[i].hover) {
				this.options[i].action();
				break;
			}
		}

		this.close();
	}

	this.onMouseOut = onMouseOut;
	function onMouseOut() {
		for(var i = 0; i < this.options.length; i++) {
			this.options[i].hover = false;
		}
	}
}

function SpriteList() {
	this.list = new Array();	// Store the sprites themselves

	// Methods
	this.appendSprite = appendSprite;
	function appendSprite(sprite) {
		this.list.push(sprite);

		this.list.sort(function(a, b) {	// Ensure that we're sorted by the zIndex of the sprites
			return a.zIndex - b.zIndex;
		});
	}

	this.drawAll = drawAll;
	function drawAll(renderingContext) {
		for(var i = 0; i < this.list.length; i++) {
			this.list[i].draw(renderingContext);
		}
	}
	
	this.findMouseHover = findMouseHover;
	function findMouseHover(x, y) {
		for(var i = this.list.length - 1; i >= 0; i--) {
			// Traverse the list backwards, because zIndex
			if(this.list[i].checkMouse(x, y) == 1) {
				return this.list[i];
			}
		}
		
		return 0;
	}
}

function runGame() {
	var canvas = document.getElementById("mainGame");
	var renderingContext = canvas.getContext("2d");

	var list = new SpriteList();
	var background = new Sprite("background.gif", function(x, y) {
		var option1 = new MenuOption("Option 1", function() {
			addDbgStatus("Option 1 Clicked!");
		});
		
		var option2 = new MenuOption("Option 2", function() {
			addDbgStatus("Option 2 Clicked!");
		});
		
		contextMenu.x = x;
		contextMenu.y = y;
		contextMenu.newOption(option1);
		contextMenu.newOption(option2);
		contextMenu.open = true;
	});

	background.zIndex = -1;
	list.appendSprite(background);
	
	var menuButton = new Sprite("menuButton.gif", function(x, y) {
		var option1 = new MenuOption("Menu 1", function() {
			addDbgStatus("Menu 1 Clicked!");
		});
		
		var option2 = new MenuOption("Menu 2", function() {
			addDbgStatus("Menu 2 Clicked!");
		});
		
		contextMenu.x = x;
		contextMenu.y = y;
		contextMenu.newOption(option1);
		contextMenu.newOption(option2);
		contextMenu.open = true;
	});

	list.appendSprite(menuButton);

	contextMenu = new Menu(0,0);
	contextMenu.zIndex = 100;
	list.appendSprite(contextMenu);

	var currentMouseOver = 0;

	document.addEventListener('keydown', function(event) {
		if(event.keyCode == 37) {
			// LEFT
			list.drawAll(renderingContext);
		} else if(event.keyCode == 39) {
			// RIGHT
			list.drawAll(renderingContext);
		} else if(event.keyCode == 38) {
			// UP
			list.drawAll(renderingContext);
		} else if(event.keyCode == 40) {
			// DOWN
			list.drawAll(renderingContext);
		}
	});

	canvas.addEventListener('mousemove', function(event) {
		if(currentMouseOver != list.findMouseHover(event.clientX, event.clientY) && currentMouseOver != 0) {
			currentMouseOver.onMouseOut();
		}

		currentMouseOver = list.findMouseHover(event.clientX, event.clientY);
		currentMouseOver.onMouseHover(event.clientX, event.clientY);

		list.drawAll(renderingContext);
	});

	canvas.addEventListener('mouseleave', function(event) {
		currentMouseOver.onMouseOut();
		currentMouseOver = 0;

		list.drawAll(renderingContext);
	});

	canvas.addEventListener('click', function(event) {
		if(list.findMouseHover(event.clientX, event.clientY) != contextMenu && contextMenu.open) {
			contextMenu.close();
		} else {
			list.findMouseHover(event.clientX, event.clientY).onMouseClick(event.clientX, event.clientY);
		}

		list.drawAll(renderingContext);
	});

	list.drawAll(renderingContext);
}
