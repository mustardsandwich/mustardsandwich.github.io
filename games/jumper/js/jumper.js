/*   JUMPER 2
 *   William Tippins
 *
 *   This was one of my first attempts at making a platformer in Python.
 *   I have ported it to Javascript for future reference.
 */

/*   INITIALIZING THE GAME
 *   Here we initialize the game with dimensions 640 x 480 pixels.
 *   We also initialize a "pointer" - Phaser uses this to let you play with mouse or touchscreen.
 */
var game = new Phaser.Game(640, 480, Phaser.CANVAS, 'game_canvas', { preload: preload, create: create, update: update });

/*   LOADING A CUSTOM FONT
 *   Uses the Google program WebFontLoader to implement my handwriting.
 *   Credit to the Amphibian Abstracts website for finding this Phaser workaround.
 */
var wfconfig = {
    active: function() { console.log("Fonts successfully loaded!"); },
    custom: { families: ['Tippins', 'Comic Neue'] }
};
WebFont.load(wfconfig);

/*   PRELOAD FUNCTION
 *   This function loads assets before the game starts.
 */
function preload() {
	// Here we preload all of the game's assets.
	game.load.image('background', 'img/background.png');
	game.load.spritesheet('menu_button_play', 'img/button_play.png', 256, 128);
	game.load.spritesheet('jumper', 'img/jumper.png', 78, 89);
	game.load.spritesheet('explode', 'img/explode.png', 100, 100);
	game.load.spritesheet('carrot', 'img/carrot.png', 78, 39);
}

var room = 0;
var jumper;
var jumper_xstate = 1;
var jumper_ystate = 0;
var jumper_speed = 450;
var jumper_frames = [[0, 1], [2, 3]];

/*   CREATE FUNCTIONS
 *   Here we draw everything.
 */
function create(){
	switch(room){
	    case 0:
			game.add.sprite(0, 0, 'background');
			menu_title = makeText(-1, 48, 0, 64, 0, 'JUMPER');
			menu_title.anchor.set(0.5, 0.5);
			menu_subtitle = makeText(-1, 84, 0, 36, 0, 'ONE SWEET RIDE');
			menu_subtitle.anchor.set(0.5, 0.5);
			menu_button_play = game.add.button(game.world.width / 2 - 128, 128, 'menu_button_play', playButton, this, 1, 0, 1);
			break;
		case 1:
	        // Here we start up the physics engine.
	        game.add.sprite(0, 0, 'background');
	        jumper = game.add.sprite(0, 0, 'jumper');
	        jumper.x = (game.world.width / 2) - (jumper.width / 2);
	        jumper.y = 400 - jumper.height;
	        game.physics.arcade.enable(jumper);
	        // jumper.body.bounce.y = 0.1;
	        jumper.frame = 2;
			break;
		default: // Error: player visits unknown room
	        game.physics.startSystem(Phaser.Physics.ARCADE);
			menu_title = makeText(-1, -1, 0, 36, 0, "Life is but an error.");
			menu_title.anchor.set(0.5, 0.5);
	        game.add.sprite(0, 0, 'background');
	        jumper = game.add.sprite(0, 0, 'jumper');
	        jumper.x = (game.world.width / 2) - (jumper.width / 2);
	        jumper.y = 400 - jumper.height;
	        game.physics.arcade.enable(jumper);
	        // jumper.body.bounce.y = 0.1;
	        jumper.frame = 2;
	}
}

/*   General functions
 *   These functions are useful throughout the code.
 *   They perform important processes and make life easier all around. :)
 */
function changeRoom(myRoom){
	// This is a generally useful function for switching rooms.
	room = myRoom;
	game.world.removeAll();
	game.input.reset(true);
	create();
	console.log("Moving to ROOM " + myRoom.toString());
}
function makeText(x, y, font, size, color, myText){
	// Our array "a" contains x and y position, font, size, and color values.
	var a = ["", "", "", "", ""];
	
	// The x position. "-1" is shorthand for centering horizontally.
	if(x === -1){ a[0] = game.world.width / 2; }
	else{ a[0] = x; }
	
	// The y position. "-1" is shorthand for centering vertically.
	if(y === -1){ a[1] = game.world.height / 2; }
	else{ a[1] = y; }
	
	/*   FONT
	 *   Different numbers for different fonts.
	 *   Here's a quick reference:
	 *
	 *   0 : Tippins (my handwriting as a font!)
	 *   1 : Comic Neue (similar to Comic Sans)
	 *
	 *   The font defaults to Tippins.
	 */
	switch(font){
		case 0:
			a[2] = "Tippins";
			break;
		case 1:
			a[2] = 'Comic Neue';
			break;
		default:
			a[2] = "Tippins";
	}
			
	// Sets the string to give to the function with size and font.
	a[3] = size.toString().concat("px ", a[2]);
			
	/*   COLOR
	 *   Different numbers for different colors.
	 *   Here's a quick reference:
	 *   
	 *   0 : JUMPER GREEN #145D
	 *   1 : BLACK #000
	 *
	 *   The color defaults to jumper green.
	 */
	switch(color){
		case 0:
			a[4] = "#145D";
			break;
		case 1:
			a[4] = "#000";
			break;
		default:
			a[4] = "#145D";
	}
			
	return game.add.text(a[0], a[1], myText, { font: a[3], fill: a[4] });
	// To center, use .anchor.set(0.5, 0.5)
}
function playButton(){
	// Start the game.
	changeRoom(2); 
}

/*   MAIN LOOP
 *   This is where the magic happens!
 */
function update() {
	// Set default speed to 0
	jumper.body.velocity.x = 0;
	
	// Check that Jumper doesn't fall through the floor.
	if(jumper.y >= 400 - jumper.height){
		jumper.body.velocity.y = 0;
		jumper.body.gravity.y = 0;
		jumper_ystate = 0;
	}
	
	// Let Jumper wrap around the screen.
	if(jumper.x > game.world.width){ jumper.x = -jumper.width; }
	if(jumper.x < -jumper.width){ jumper.x = game.world.width; }
	
	// Jumper movement
	if(game.input.keyboard.isDown(Phaser.Keyboard.LEFT)
	|| game.input.keyboard.isDown(Phaser.Keyboard.A)){
		jumper_xstate = 0;
		jumper.body.velocity.x = -jumper_speed;
	}
	else if(game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)
		 || game.input.keyboard.isDown(Phaser.Keyboard.D)){
		jumper_xstate = 1;
		jumper.body.velocity.x = jumper_speed;
	}
	
	// Jumper jumping
	if((game.input.keyboard.isDown(Phaser.Keyboard.UP)
     || game.input.keyboard.isDown(Phaser.Keyboard.W)) && jumper_ystate === 0){
		jumper_ystate = 1;
		jumper.body.velocity.y = -800;
		jumper.body.gravity.y = 1500;
	}
	
	// Set jumper sprite
	jumper.frame = jumper_frames[jumper_xstate][jumper_ystate];
}