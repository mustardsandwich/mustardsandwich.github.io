/*   DODGEBALL
 *   William Tippins
 *
 *   This was a little game I made to teach myself the basics of Javascript.
 *   It doesn't use an engine or anything and just refreshes after you win.
 *   Also, you can literally just stand in the bottom right corner for most of the levels.
 */
var canvas = document.getElementById("dodgeball_canvas");
var ctx = canvas.getContext("2d");

/*   LOADING A CUSTOM FONT
 *   Uses the Google program WebFontLoader to implement my handwriting.
 *   Credit to the Amphibian Abstracts website for finding this Phaser workaround.
 */
var wfconfig = {
    active: function() { console.log("Tippins font successfully loaded!"); },
    custom: { families: ['Tippins'] }
};
WebFont.load(wfconfig);

// Let's declare some variables here
var ball_x = 240;
var ball_y = 160;
var ball_spawn_x = ball_x;
var ball_spawn_y = ball_y;
var ball_dx = 5;
var ball_dy = 5;
var ball_spawn_dx = ball_dx;
var ball_spawn_dy = ball_dy;
var ball_radius = 30;

var player_x = 10;
var player_y = 400;
var player_spawn_x = player_x;
var player_spawn_y = player_y;
var player_dx = 6;
var player_spawn_dx = player_dx;
var player_dir = "RIGHT";
var player_width = 60;
var player_height = 80;
var swapped = false;

var leftPressed = false;
var rightPressed = false;

var score = 0;
var win_condition = 25;
var level = 0;
var levelFrames = 120;

function game_loop() {
	// You want to clear the canvas in between frames
	// or moving objects will leave trails.
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawBall();
	drawPlayer();
	drawScore();
	
	var dead = collisionDetection();
	
	if(dead) {
		player_x = player_spawn_x;
		player_y = player_spawn_y;
		player_dx = player_spawn_dx;
		ball_x = ball_spawn_x;
		ball_y = ball_spawn_y;
		ball_dx = ball_spawn_dx;
		ball_dy = ball_spawn_dy;
		score = 0;
		level = 0;
		levelFrames = 120;
		swapped = false;
	}
	
	if(levelFrames > 0) {
		levelMessage(level);
		levelFrames--;
	}
	else if(levelFrames == 0){
		levelFrames--;
		level++;
	}
	
	if(level == 6){
		document.location.reload();
	}
}

function drawBall() {
	ctx.beginPath();
	ctx.arc(ball_x, ball_y, ball_radius, 0, Math.PI * 2, false);
	ctx.fillStyle = "#3399FF";
	ctx.fill();
	ctx.lineWidth = 4;
	ctx.strokeStyle = "#0033CC";
	ctx.stroke();
	ctx.closePath();
	
	if(ball_x > canvas.width - ball_radius || ball_x < ball_radius) {
		ball_dx = -ball_dx;
		addScore();
	}
	if(ball_y > canvas.height - ball_radius || ball_y < ball_radius) {
		ball_dy = -ball_dy;
		addScore();
	}
	
	ball_x += ball_dx;
	ball_y += ball_dy;
}

function drawPlayer() {
	ctx.beginPath();
	ctx.rect(player_x, player_y, player_width, player_height);
	ctx.fillStyle = "#FF0000";
	ctx.fill();
	ctx.lineWidth = 4;
	ctx.strokeStyle = "#990000";
	ctx.stroke();
	ctx.closePath();
	
	if(swapped == false){
		if(leftPressed && player_x > 0) {
			player_x -= player_dx;
			player_dir = "LEFT";
		}
		else if(rightPressed && player_x < canvas.width - player_width) {
			player_x += player_dx;
			player_dir = "RIGHT";
		}
	}
	else{
		if(leftPressed && player_x < canvas.width - player_width) {
			player_x += player_dx;
			player_dir = "RIGHT";
		}
		else if(rightPressed && player_x > 0) {
			player_x -= player_dx;
			player_dir = "LEFT";
		}
	}
}

function collisionDetection(){
	var circle = {x: ball_x, y: ball_y, r: ball_radius};
	var rect = {x: player_x, y: player_y, w: player_width, h: player_height};
	
	// Credit to markE on stackoverflow for collision code
	var distX = Math.abs(circle.x - rect.x-rect.w/2);
	var distY = Math.abs(circle.y - rect.y-rect.h/2);

	if (distX > (rect.w/2 + circle.r)) { return false; }
	if (distY > (rect.h/2 + circle.r)) { return false; }

	if (distX <= (rect.w/2)) { return true; } 
	if (distY <= (rect.h/2)) { return true; }

	var dx=distX-rect.w/2;
	var dy=distY-rect.h/2;
	return (dx*dx+dy*dy<=(circle.r*circle.r));
	
}

function drawScore() {
	ctx.beginPath();
	ctx.font = "36px Tippins";
	ctx.fillStyle = "#FF0000";
	ctx.textAlign = "left";
	// Text, then the coordinates on the screen for it
	ctx.fillText("Score: " + score, 8, 32);
	ctx.closePath();
}

function addScore() {
	score++;
	if(score >= win_condition) {
		score = 0;
		levelFrames = 120;
		levelConditions();
	}
}

function levelConditions() {
	player_x = player_spawn_x;
	player_y = player_spawn_y;
	ball_x = ball_spawn_x;
	ball_y = ball_spawn_y;
	
	switch(level){
		case 1:
			ball_dx = ball_spawn_dx * 2;
			ball_dy = ball_spawn_dy * 2;
			break;
		case 2:
			ball_dx = ball_spawn_dx;
			ball_dy = ball_spawn_dy;
		
			player_dx = 2;
			break;
		case 3:
			player_dx = player_spawn_dx;
			
			swapped = true;
			player_y = 0;
			ball_x = (canvas.width / 2) - ball_radius;
			ball_y = 400;
			break;
		case 4:
			swapped = false;
			
			ball_radius = 75;
			break;
		default:
			ball_dx = 0;
			ball_dy = 0;
			break;
	}
}

function levelMessage(level_message) {
	// Display the level message
	switch(level_message) {
		case 0:
			ctx.beginPath();
			ctx.font = "36px Tippins";
			ctx.fillStyle = "#FF0000";
			ctx.textAlign = "center";
			ctx.fillText("Level 1: Dodge the Ball", canvas.width / 2, canvas.height / 2);
			ctx.closePath();
			break;
		case 1:
			ctx.beginPath();
			ctx.font = "36px Tippins";
			ctx.fillStyle = "#FF0000";
			ctx.textAlign = "center";
			ctx.fillText("Level 2: Speeding Bullet", canvas.width / 2, canvas.height / 2);
			ctx.closePath();
			break;
		case 2:
			ctx.beginPath();
			ctx.font = "36px Tippins";
			ctx.fillStyle = "#FF0000";
			ctx.textAlign = "center";
			ctx.fillText("Level 3: Dead Weight", canvas.width / 2, canvas.height / 2);
			ctx.closePath();
			break;
		case 3:
			ctx.beginPath();
			ctx.font = "36px Tippins";
			ctx.fillStyle = "#FF0000";
			ctx.textAlign = "center";
			ctx.fillText("Level 4: Upside-Down", canvas.width / 2, canvas.height / 2);
			ctx.closePath();
			break;
		case 4:
			ctx.beginPath();
			ctx.font = "36px Tippins";
			ctx.fillStyle = "#FF0000";
			ctx.textAlign = "center";
			ctx.fillText("Level 5: GREAT BALLS OF DOOM", canvas.width / 2, canvas.height / 2);
			ctx.closePath();
			break;
		default:
			ctx.beginPath();
			ctx.font = "36px Tippins";
			ctx.fillStyle = "#FF0000";
			ctx.textAlign = "center";
			ctx.fillText("Congratulations! You won!", canvas.width / 2, canvas.height / 2);
			ctx.closePath();
		}
}

// Key event handlers
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
// document.addEventListener("", , false);

function keyDownHandler(e) {
	if(e.keyCode == 37 || e.keyCode == 65) {
		leftPressed = true;
	}
	else if(e.keyCode == 39 || e.keyCode == 68) {
		rightPressed = true;
	}
}

function keyUpHandler(e) {
	if(e.keyCode == 37 || e.keyCode == 65) {
		leftPressed = false;
	}
	else if(e.keyCode == 39 || e.keyCode == 68) {
		rightPressed = false;
	}
}

function getTouchPos(e){
	if(!e){ var e = event; }
	if(e.touches){
		if(e.touches.length == 1){
			var touch = e.touches[0];
			var touch_x = touch.pageX - touch.target.offsetLeft;
		}
	}
}

// This is the loop for stuff happening
setInterval(game_loop, 17);