// store if log categories are enabled
var DebugLogCategory = {
	bitsy : false,
	editor : false,
};

function bitsyLog(message, category) {
	if (!category) {
		category = "bitsy";
	}

	if (DebugLogCategory[category] === true) {
		console.log(category + "::" + message);
	}
}

// input
var key = {
	left : 37,
	right : 39,
	up : 38,
	down : 40,
	space : 32,
	enter : 13,
	w : 87,
	a : 65,
	s : 83,
	d : 68,
	r : 82,
	shift : 16,
	ctrl : 17,
	alt : 18,
	cmd : 224
};

var InputManager = function() {
	var self = this;

	var pressed;
	var ignored;
	var newKeyPress;
	var touchState;

	var SwipeDir = {
		None : -1,
		Up : 0,
		Down : 1,
		Left : 2,
		Right : 3,
	};

	function resetAll() {
		pressed = {};
		ignored = {};
		newKeyPress = false;

		touchState = {
			isDown : false,
			startX : 0,
			startY : 0,
			curX : 0,
			curY : 0,
			swipeDistance : 30,
			swipeDirection : SwipeDir.None,
			tapReleased : false
		};
	}
	resetAll();

	function stopWindowScrolling(e) {
		if(e.keyCode == key.left || e.keyCode == key.right || e.keyCode == key.up || e.keyCode == key.down || !isPlayerEmbeddedInEditor)
			e.preventDefault();
	}

	function tryRestartGame(e) {
		/* RESTART GAME */
		if ( e.keyCode === key.r && ( e.getModifierState("Control") || e.getModifierState("Meta") ) ) {
			if ( confirm("Restart the game?") ) {
				reset_cur_game();
			}
		}
	}

	function eventIsModifier(event) {
		return (event.keyCode == key.shift || event.keyCode == key.ctrl || event.keyCode == key.alt || event.keyCode == key.cmd);
	}

	function isModifierKeyDown() {
		return ( self.isKeyDown(key.shift) || self.isKeyDown(key.ctrl) || self.isKeyDown(key.alt) || self.isKeyDown(key.cmd) );
	}

	this.ignoreHeldKeys = function() {
		for (var key in pressed) {
			if (pressed[key]) { // only ignore keys that are actually held
				ignored[key] = true;
				// bitsyLog("IGNORE -- " + key);
			}
		}
	}

	this.onkeydown = function(event) {
		// bitsyLog("KEYDOWN -- " + event.keyCode);

		stopWindowScrolling(event);

		tryRestartGame(event);

		// Special keys being held down can interfere with keyup events and lock movement
		// so just don't collect input when they're held
		{
			if (isModifierKeyDown()) {
				return;
			}

			if (eventIsModifier(event)) {
				resetAll();
			}
		}

		if (ignored[event.keyCode]) {
			return;
		}

		if (!self.isKeyDown(event.keyCode)) {
			newKeyPress = true;
		}

		pressed[event.keyCode] = true;
		ignored[event.keyCode] = false;
	}

	this.onkeyup = function(event) {
		// bitsyLog("KEYUP -- " + event.keyCode);
		pressed[event.keyCode] = false;
		ignored[event.keyCode] = false;
	}

	this.ontouchstart = function(event) {
		event.preventDefault();

		if( event.changedTouches.length > 0 ) {
			touchState.isDown = true;

			touchState.startX = touchState.curX = event.changedTouches[0].clientX;
			touchState.startY = touchState.curY = event.changedTouches[0].clientY;

			touchState.swipeDirection = SwipeDir.None;
		}
	}

	this.ontouchmove = function(event) {
		event.preventDefault();

		if( touchState.isDown && event.changedTouches.length > 0 ) {
			touchState.curX = event.changedTouches[0].clientX;
			touchState.curY = event.changedTouches[0].clientY;

			var prevDirection = touchState.swipeDirection;

			if( touchState.curX - touchState.startX <= -touchState.swipeDistance ) {
				touchState.swipeDirection = SwipeDir.Left;
			}
			else if( touchState.curX - touchState.startX >= touchState.swipeDistance ) {
				touchState.swipeDirection = SwipeDir.Right;
			}
			else if( touchState.curY - touchState.startY <= -touchState.swipeDistance ) {
				touchState.swipeDirection = SwipeDir.Up;
			}
			else if( touchState.curY - touchState.startY >= touchState.swipeDistance ) {
				touchState.swipeDirection = SwipeDir.Down;
			}

			if( touchState.swipeDirection != prevDirection ) {
				// reset center so changing directions is easier
				touchState.startX = touchState.curX;
				touchState.startY = touchState.curY;
			}
		}
	}

	this.ontouchend = function(event) {
		event.preventDefault();

		touchState.isDown = false;

		if( touchState.swipeDirection == SwipeDir.None ) {
			// tap!
			touchState.tapReleased = true;
		}

		touchState.swipeDirection = SwipeDir.None;
	}

	this.isKeyDown = function(keyCode) {
		return pressed[keyCode] != null && pressed[keyCode] == true && (ignored[keyCode] == null || ignored[keyCode] == false);
	}

	this.anyKeyPressed = function() {
		return newKeyPress;
	}

	this.resetKeyPressed = function() {
		newKeyPress = false;
	}

	this.swipeLeft = function() {
		return touchState.swipeDirection == SwipeDir.Left;
	}

	this.swipeRight = function() {
		return touchState.swipeDirection == SwipeDir.Right;
	}

	this.swipeUp = function() {
		return touchState.swipeDirection == SwipeDir.Up;
	}

	this.swipeDown = function() {
		return touchState.swipeDirection == SwipeDir.Down;
	}

	this.isTapReleased = function() {
		return touchState.tapReleased;
	}

	this.resetTapReleased = function() {
		touchState.tapReleased = false;
	}

	this.onblur = function() {
		// bitsyLog("~~~ BLUR ~~");
		resetAll();
	}
}

var input = new InputManager();