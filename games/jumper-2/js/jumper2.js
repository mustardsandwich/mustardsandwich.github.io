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
    active: function() { console.log("Tippins font successfully loaded!"); },
    custom: { families: ['Tippins'] }
};
WebFont.load(wfconfig);

/*   PRELOAD FUNCTION
 *   This function loads assets before the game starts.
 */
function preload() {
	// Here we preload all of the game's assets.
	var j2 = 'assets/jumper2/';
	game.load.image('background', j2 + 'background.png');
	game.load.spritesheet('jumper', j2 + 'jumper.png', 78, 89);
}

var jumper;
var jumper_xstate = 1;
var jumper_ystate = 0;
var jumper_speed = 450;
var jumper_frames = [[0, 1], [2, 3]];

/*   CREATE FUNCTIONS
 *   Here we draw everything.
 */
function create(){
	// Here we start up the physics engine.
	game.physics.startSystem(Phaser.Physics.ARCADE);
	game.add.sprite(0, 0, 'background');
	jumper = game.add.sprite(0, 0, 'jumper');
	jumper.x = (game.world.width / 2) - (jumper.width / 2);
	jumper.y = 400 - jumper.height;
	game.physics.arcade.enable(jumper);
	jumper.body.bounce.y = 0.1;
	jumper.frame = 2;
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