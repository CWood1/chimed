function addDbgStatus(status) {
	var para = document.createElement("p");
	para.innerHTML = status;
	document.getElementById("debugConsole").appendChild(para);
	//Makes the debug window scroll to the bottom every time a new status occurs. 
	document.getElementById("debugConsole").scrollTop = document.getElementById("debugConsole").scrollHeight;
	return para;
}

function pageToLocalCoords(x, y) {
	 /** Okay, I've changed this up a little. It kind of works now! At least on chrome. 
		 I haven't deleted anything from the original function, just commented it out,
		 just in case we still need that code. - Cam
	*/
	
	var html = document.documentElement;
	var body = document.body;
	var canvas = document.getElementById("mainGame");
	
	var locX = x - canvas.offsetLeft;
	var locY = y - canvas.offsetTop;
	
	return {x : locX,
		y : locY};
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
	this.active = true;	// Enabled by default

	this.subMenu = false;
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
	this.enabled = true;

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
			if(this.options[i].hover && this.options[i].active) {
				renderingContext.fillStyle = "#0000AA";
			} else if(this.options[i].hover && !this.options[i].active) {
				renderingContext.fillStyle = "#777777";
			} else if(!this.options[i].hover && this.options[i].active) {
				renderingContext.fillStyle = "#0000FF";
			} else {
				renderingContext.fillStyle = "#AAAAAA";
			}

			renderingContext.fillRect(this.x + this.border, this.y + i*this.oneElHeight + 2*i*this.border + this.border, this.width, this.oneElHeight);
			renderingContext.strokeRect(this.x, this.y + i*this.oneElHeight + 2*i*this.border,
					this.width + 2*this.border, this.oneElHeight + 2*this.border);
			renderingContext.fillStyle = "white";
			renderingContext.fillText(this.options[i].text, this.x + this.border + 1, this.y + 15 + this.border + i*this.oneElHeight + 2*i*this.border);

			if(this.options[i].hover && this.options[i].subMenu != false) {
				this.options[i].subMenu.draw(renderingContext);
			}
		}
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

		this.close();
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

function SpriteList() {
	this.list = new Array();	// Store the sprites themselves

	this.currentHover = false;
	this.enabled = true;

	this.zIndex = 0;

	// Methods
	this.appendSprite = appendSprite;
	function appendSprite(sprite) {
		this.list.push(sprite);

		this.list.sort(function(a, b) {	// Ensure that we're sorted by the zIndex of the sprites
			return a.zIndex - b.zIndex;
		});

		for(var i = 0; i < this.list.length; i++) {
			addDbgStatus(this.list[i].zIndex);
		}
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
	}

	this.checkMouse = checkMouse;
	function checkMouse(x, y) {
		for(var i = this.list.length - 1; i >= 0; i--) {
			// Traverse the list backwards, because zIndex
			if(this.list[i].checkMouse(x, y) != false) {
				return this.list[i];
			}
		}
		
		return false;
	}

	this.onMouseHover = onMouseHover;
	function onMouseHover(x, y) {
		if(this.currentHover == false) {
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
			this.currentHover.onMouseClick(x, y);
		}
	}
}

function runGame() {
	var canvas = document.getElementById("mainGame");
	var renderingContext = canvas.getContext("2d");

	mainList = new SpriteList();
	mainMenu = new SpriteList();
	gamePlay = new SpriteList();
	gamePlay.enabled = false;
	optsMenu = new SpriteList();
	optsMenu.enabled = false;

	var mmBackground = new Sprite("background.gif", function(x, y) {

	});

	mmBackground.zIndex = -1;

	// TODO: This needs centering.
	var mmMenu = new Menu(0,0);
	var mmMenuOptPlay = new MenuOption("Play", function() {
		addDbgStatus("Play pressed.");

		mainMenu.enabled = false;
		gamePlay.enabled = true;
		mainList.appendSprite(gamePlay);
	});

	var mmMenuOptOpts = new MenuOption("Options", function() {
		addDbgStatus("Options pressed.");

		mainMenu.enabled = false;
		optsMenu.enabled = true;
		mainList.appendSprite(optsMenu);
	});

	mmMenu.newOption(mmMenuOptPlay);
	mmMenu.newOption(mmMenuOptOpts);

	mmMenu.zIndex = 100;
	mmMenu.open = true;

	mainMenu.appendSprite(mmBackground);
	mainMenu.appendSprite(mmMenu);
	mainList.appendSprite(mainMenu);

	var background = new Sprite("background.gif", function(x, y) {
		contextMenu.close();

		var option1 = new MenuOption("Option 1", function() {
			addDbgStatus("Option 1 Clicked!");
		});
		
		var option2 = new MenuOption("Option 2", function() {
			addDbgStatus("Option 2 Clicked!");
		});

		var subMenuOpt = new MenuOption("Submenu", function() {
			addDbgStatus("Submenu Clicked!");
		});

		var subMenu = new Menu(0,0);

		subMenuOption1 = new MenuOption("Sub 1", function() {
			addDbgStatus("Sub 1 Clicked!");
		});

		subMenu.newOption(subMenuOption1);
		subMenuOpt.subMenu = subMenu;
		option2.active = false;

		contextMenu.x = x;
		contextMenu.y = y;
		contextMenu.newOption(option1);
		contextMenu.newOption(option2);
		contextMenu.newOption(subMenuOpt);
		contextMenu.open = true;
	});

	background.zIndex = -1;
	gamePlay.appendSprite(background);
	
	var menuButton = new Sprite("menuButton.gif", function(x, y) {
		contextMenu.close();

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

	gamePlay.appendSprite(menuButton);

	contextMenu = new Menu(0,0);
	contextMenu.zIndex = 100;
	gamePlay.appendSprite(contextMenu);

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
}
