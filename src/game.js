var sound = true;
var music = true;
var score = 0;

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

function Menu(x, y, scale=1) {
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
			renderingContext.fillText(this.options[i].text, this.x + this.border + 1,
					this.y + this.fontSize + this.border + i*this.oneElHeight + 2*i*this.border);

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

function MessageBox(x, y, titleText, message, scale=1) {
	this.message = message;
	this.titleText = titleText;

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

	this.draw = function(renderingContext) {
		// TODO: Newlines don't work in HTML5 rendering context. Research.
		if(!this.open) {
			return;
		}

		renderingContext.beginPath();
		renderingContext.strokeStyle = "black";
		renderingContext.font = this.fontSize + "px Arial";

		this.height = (this.message.split("\n").length + 1)*this.lineHeight + 3*this.border;
			// Don't subtract 1, as we'll need the title text
			// One border for the top, one for the bottom, and one between the title and the message

		this.width = renderingContext.measureText(this.message).width + 2*this.border;

		if(renderingContext.measureText(this.titleText).width + this.lineHeight > this.width) {
			this.width = renderingContext.measureText(this.titleText).width + this.lineHeight + 2*this.border;
		}

//		addDbgStatus("Width: " + this.width + " Height: " + this.height);

		renderingContext.fillStyle = "#0000FF";

		renderingContext.fillRect(this.x + this.border, this.y + this.border, this.width, this.lineHeight);
		renderingContext.strokeRect(this.x, this.y,
				this.width + 2*this.border, this.lineHeight + 2*this.border);
		renderingContext.fillStyle = "white";
		renderingContext.fillText(this.titleText, this.x + this.border + 1,
				this.y + this.fontSize + this.border);

		if(this.closable) {
			renderingContext.fillStyle = "#FF0000";

			renderingContext.fillRect(this.x + this.border + this.width - this.lineHeight, this.y + this.border,
					this.lineHeight, this.lineHeight);
		}

		renderingContext.fillStyle = "#0000FF";

		renderingContext.fillRect(this.x + this.border, this.y + 2*this.border + this.lineHeight,
				this.width, this.height - this.lineHeight);
		renderingContext.strokeRect(this.x, this.y + this.lineHeight + this.border,
				this.width + 2*this.border, (this.height - this.lineHeight) + 2*this.border);
		renderingContext.fillStyle = "white";
		renderingContext.fillText(this.message, this.x + this.border + 1,
				this.y + this.fontSize + 2*this.border + this.lineHeight);
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

	}

	this.onMouseClick = function(x, y) {
		if(this.y + this.border <= y && this.y + this.lineHeight + this.border >= y && this.x + this.border + this.width - this.lineHeight <= x && this.x + this.border + this.width >= x) {
			this.close();
		}
	}

	this.onMouseOut = function(x, y) {

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

	mainList = new SpriteList();

	mainMenu = new SpriteList();
	gamePlay = new SpriteList();
	optsMenu = new SpriteList();
	credits = new SpriteList();
	highScore = new SpriteList();

// Main menu //////////////////////////////////////////////////////////////////
	mainMenu.enabled = true;

	var mmBackground = new Sprite("background.jpg", function(x, y) { });
	mmBackground.zIndex = -1;
	mainMenu.appendSprite(mmBackground);

	// TODO: This needs centering
	var mmMenu = new Menu(0, 0, 1.5);
	mmMenu.autoClose = false;

	var mmMenuOptPlay = new MenuOption("Play", function() {
		mainMenu.enabled = false;
		gamePlay.enabled = true;

		mainList.appendSprite(gamePlay);
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
	mainMenu.appendSprite(mmMenu);

	mainList.appendSprite(mainMenu);

// Gameplay ///////////////////////////////////////////////////////////////////
	gamePlay.enabled = false;

	var background = new Sprite("background.jpg", function(x, y) {
		var contextMb = new MessageBox(x, y, "Test", "This is\na test");
		contextMb.open = true;

		gamePlay.activeMenu = contextMb;
	});

	background.zIndex = -1;
	gamePlay.appendSprite(background);
	
	var menuButton = new Sprite("menuButton.gif", function(x, y) {
		contextMenu = new Menu(x, y);

		var option1 = new MenuOption("Menu 1", function() {
			addDbgStatus("Menu 1 Clicked!");
		});
		
		var option2 = new MenuOption("Menu 2", function() {
			addDbgStatus("Menu 2 Clicked!");
		});
		
		contextMenu.newOption(option1);
		contextMenu.newOption(option2);
		contextMenu.open = true;

		gamePlay.activeMenu = contextMenu;
	});

	gamePlay.appendSprite(menuButton);

// Options menu ///////////////////////////////////////////////////////////////
	optsMenu.enabled = false;

	optsBackground = new Sprite("background.jpg", function(x, y) { });
	optsBackground.zIndex = -1;
	optsMenu.appendSprite(optsBackground);

	// TODO: Center this
	oMenu = new Menu(0, 0, 1.5);
	oMenu.autoClose = false;
	oMenu.open = true;

	var oMenuToggleSound = new MenuOption("Sound ON/off", function() {
		this.toggle = !this.toggle;
		sound = this.toggle;

		if(this.toggle) {
			this.text = "Sound ON/off";
		} else {
			this.text = "Sound on/OFF";
		}
	});
	oMenuToggleSound.toggle = true;
	oMenu.newOption(oMenuToggleSound);

	var oMenuToggleMusic = new MenuOption("Music ON/off", function() {
		this.toggle = !this.toggle;
		music = this.toggle;

		if(this.toggle) {
			this.text = "Music ON/off";
		} else {
			this.text = "Music on/OFF";
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

	optsMenu.appendSprite(oMenu);

// Credits ////////////////////////////////////////////////////////////////////
	credits.enabled = false;

	cBackground = new Sprite("background.jpg", function(x, y) { });
	cBackground.zIndex = -1;
	credits.appendSprite(cBackground);

	cBox = new MessageBox(0, 0, "Credits", "Created by:\nA Bunch of People.");
	cBox.closable = false;
	cBox.open = true;
	credits.appendSprite(cBox);

// High Score /////////////////////////////////////////////////////////////////
	highScore.enabled = false;

	hBackground = new Sprite("background.jpg", function(x, y) { });
	hBackground.zIndex = -1;
	highScore.appendSprite(hBackground);

	hScore = new MessageBox(0, 0, "High Score", score.toString());
	hScore.closable = false;
	hScore.open = true;
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
}
