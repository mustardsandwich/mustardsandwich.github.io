/*   WONDERPARC 2
 *   William Tippins
 *
 *   One of the goals of this game is to fit the entire thing into one .js file.
 *   If you're using Notepad++, pressing "Alt + 1" will collapse the top layer.
 *   This hides functions and long comments to improve readability.
 */

/*   INITIALIZING THE GAME
 *   Here we initialize the game with dimensions 640 x 480 pixels.
 *   We also initialize a "pointer" - Phaser uses this to let you play with mouse or touchscreen.
 */
var game = new Phaser.Game(640, 480, Phaser.CANVAS, 'game_canvas', { preload: preload, create: create, update: update });
var pointer = new Phaser.Pointer(game, 0);

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
 *   This cuts down on lengthy load times within the game.
 *   Later in development, new loading systems may be implemented to optimize the game.
 */
function preload() {
	// These are all of the images used in the main menu.
	game.load.image('menu_background', 'assets/menu/background.png');
	game.load.spritesheet('menu_button_story', 'assets/menu/button_story.png', 256, 128);
	game.load.spritesheet('menu_button_arcade', 'assets/menu/button_arcade.png', 256, 128);
	// game.load.spritesheet('menu_button_music', 'assets/menu/button_music.png', 64, 64);
	// game.load.spritesheet('menu_button_sound', 'assets/menu/button_sound.png', 64, 64);
	game.load.spritesheet('menu_button_easy', 'assets/menu/button_easy.png', 128, 64);
	game.load.spritesheet('menu_button_normal', 'assets/menu/button_normal.png', 128, 64);
	game.load.spritesheet('menu_button_hard', 'assets/menu/button_hard.png', 128, 64);
	game.load.spritesheet('menu_crab', 'assets/menu/crab.png', 64, 48);
	
	// These images are used throughout story mode.
	game.load.image('dialogue_box', 'assets/gui/dialogue.png');
	
	// These images are used in the dolphin minigame.
	game.load.image('dolphin', 'assets/dolphin/dolphin_right.png');
	game.load.image('dolphin_ring', 'assets/dolphin/hoop.png');
}

/*   ROOMS - A GUIDE
 *   The further you get into the code, the more convoluted this will become...
 *   Each "screen" in the game is assigned a number starting from 0, which is the main menu.
 *   Room is changed with the changeRoom() function under "General functions" unless otherwise noted.
 *   If the room you go to doesn't exist, the game sends you to a "glitch room."
 *   Here is your guide to the rooms in the game: 
 *
 *   MENU SCREENS
 *   0 : main menu
 *   1 : story mode menu
 *   2 : arcade mode menu
 *   
 *   STORY MODE
 *   (10 - 20) : CUTSCENE 1
 *      10 : scene 1
 *   (21 - 30) : OVERWORLD 1
 *      21 : far left side
 *
 *   ARCADE MODE
 *   1000 : Dolphin menu
 *   1001 : Dolphin game
 */
var room = 0;   					// Which room (level) are we in?

/*   VARIABLES
 *   I try to declare a good amount of variables in the beginning.
 *   Variables that I preface with an S should be saved to a cookie when the player saves.
 */

/* S */ var story = 0;  			// How far along you are in the story.
/* S */ var difficulty = 1;   		// Game difficulty: Easy (0), Normal (1), Hard (2)
		var diffLang = ["EASY", "NORMAL", "HARD"];

// For the main menu...
var menu_title, menu_subtitle;														// Title at the top of the menu
var menu_button_story, menu_button_arcade, menu_button_difficulty;					// Clickable buttons on the menu
var menu_crab, menu_crab_hide = false, menu_crab_walk = 0, menu_crab_walk_point;	// Walking crab on the menu

// Some constants for creating games...
var DOLPHIN = 0, SEAL = 1, OCTOPUS = 2;
var SHRIMP = 3, LOBSTER = 4, MANTA = 5;
var WALRUS = 6, POLAR = 7, PENGUIN = 8;

// For story mode...
// Some constants for creating character dialogue:
var PLAYER = 0, DALE = 1, EDWIN = 2;

// For arcade mode...
/* S */ var arcadeHasPlayed = [0, 0, 0, 0, 0, 0, 0, 0, 0];		// Shows a one-time tutorial for each game
/* S */ var arcadePB_easy = [0, 0, 0, 0, 0, 0, 0, 0, 0];		// Personal bests on easy difficulty
/* S */ var arcadePB_normal = [0, 0, 0, 0, 0, 0, 0, 0, 0];		// Personal bests on normal difficulty
/* S */ var arcadePB_hard = [0, 0, 0, 0, 0, 0, 0, 0, 0];		// Personal bests on hard difficulty
var score_count, score_pop, score_popTimer = -1;				// Showing score counter and pop ups ("+100")

// For the dolphin game...
var dolphin_score;															// Score for the dolphin game
var dolphin;																// The dolphin that you control
var dolphin_health, dolphin_maxHealth, dolphin_healthCt;					// Health of the dolphin
var dolphin_regen, dolphin_regenVal, dolphin_regenCt;						// Regen status of the dolphin
var dolphin_ring, dolphin_ringSpeed, dolphin_ringVal;						// The ring that you must go through

/*   CREATE FUNCTIONS
 *   This is the function that initially draws everything on the screen for each room.
 *   Because this function is so large, I have included some comments for readability.
 *   Hide the large comments with "Alt + 3" in Notepad++ to make it obvious when sections start and stop.
 */
function create() {
	switch(room){
		/*   MENU SCREENS
		 *   The following rooms are menu screens.
		 */
		case 0: // Main menu
			// Here we start up the physics engine.
			game.physics.startSystem(Phaser.Physics.ARCADE);
			
			// Here we establish the background, title, and the buttons.
			game.add.sprite(0, 0, 'menu_background');
			menu_title = makeText(-1, 48, 0, 64, 0, 'WONDERPARC 2');
			menu_title.anchor.set(0.5, 0.5);
			menu_subtitle = makeText(-1, 84, 0, 36, 0, 'THE REAL DEAL');
			menu_subtitle.anchor.set(0.5, 0.5);
			menu_button_story = game.add.button(game.world.width / 2 - 272, 128, 'menu_button_story', storyButton, this, 0, 0, 1);
			menu_button_arcade = game.add.button(game.world.width / 2 + 16, 128, 'menu_button_arcade', arcadeButton, this, 0, 0, 1);
			setDifficultyButton(difficulty);

			// Here we add the menu crab and his animations.
			menu_crab = game.add.sprite(64, game.world.height - 80, 'menu_crab');
			menu_crab_hide = false;
			game.physics.arcade.enable(menu_crab);
			menu_crab.body.collideWorldBounds = true;
			menu_crab.inputEnabled = true;
			menu_crab.animations.add('idle', [0], 10, false);
			menu_crab.animations.add('walk', [1, 2], 10, true);
			menu_crab.animations.add('hide', [0, 3, 4], 10, false);
			menu_crab.animations.add('wake', [4, 3, 0], 10, false);
			menu_crab.events.onInputDown.add(menuCrabHide, this);
			game.input.onDown.add(menuCrabWalk, this);
			break;
		case 1: // Story Mode menu
			game.add.sprite(0, 0, 'menu_background');
			menu_title = makeText(-1, 48, 0, 64, 0, 'STORY MODE');
			menu_title.anchor.set(0.5, 0.5);
			menu_subtitle = makeText(-1, 84, 0, 36, 0, 'FILE SELECT');
			menu_subtitle.anchor.set(0.5, 0.5);
			break;
		case 2: // Arcade Mode menu
			game.add.sprite(0, 0, 'menu_background');
			menu_title = makeText(-1, 48, 0, 64, 0, 'ARCADE MODE');
			menu_title.anchor.set(0.5, 0.5);
			menu_subtitle = makeText(-1, 84, 0, 36, 0, 'GAME SELECT');
			menu_subtitle.anchor.set(0.5, 0.5);
			break;
			
		/*   STORY MODE SCREENS
		 *   These screens are for the cutscenes, menus, and levels within Story Mode.
		 */
		case 10: // (10-20) : CUTSCENE 1
			break;
		case 11:
			break;
		case 12:
			break;
		case 13:
			break;
		case 14:
			break;
		case 15:
			break;
		case 16:
			break;
		case 17:
			break;
		case 18:
			break;
		case 19:
			break;
		case 20:
			break;
			
		/*   ARCADE MODE SCREENS
		 *   The following menus and levels are used for Arcade Mode.
		 */
		case 1001: // Dolphin game
			createGame(DOLPHIN, 1);
			break;
			
		/*   ERROR
		 *   There has been an error.
		 */
		default: // Error: player visits unknown room
			game.add.sprite(0, 0, 'menu_background');
			menu_title = makeText(-1, -1, 0, 36, 0, "There's been...a disturbance...");
	}
}
function createGame(myGame, mode){
	// I might use this function for creating games specifically.
	switch(myGame){
		case DOLPHIN:
			switch(difficulty){
				case 0:
					dolphin_ringSpeed = 6;
					dolphin_ringVal = 75;
					dolphin_maxHealth = 3;
					dolphin_regenVal = 3750;
					break;
				case 2:
					dolphin_ringSpeed = 14;
					dolphin_ringVal = 150;
					dolphin_maxHealth = 5;
					dolphin_regenVal = 4500;
					break;
				default:
					dolphin_ringSpeed = 10;
					dolphin_ringVal = 100;
					dolphin_maxHealth = 4;
					dolphin_regenVal = 4000;
			}
			
			// Establish background, health, and score, as well as the regen counter.
			dolphin_score = 0;
			dolphin_regen = 0;
			dolphin_health = dolphin_maxHealth;
			game.add.sprite(0, 0, 'menu_background');
			score_count = makeText(-1, 24, 0, 36, 0, "SCORE: " + dolphin_score.toString());
			score_count.anchor.set(0.5, 0.5);
			dolphin_healthCt = dolphinHealthCounter();
			dolphin_healthCt.anchor.set(0.5, 0.5);
			dolphin_regenCt = dolphinRegenCounter();
			dolphin_regenCt.anchor.set(0.5, 0.5);
			
			// This is a dummy score_pop hidden offscreen.
			score_pop = makeText(-100, -100, 0, 2, 0, "");
			
			// Here we have the dolphin...
			dolphin = game.add.sprite(2, game.world.height / 2, 'dolphin');
			game.physics.arcade.enable(dolphin);
			dolphin.body.collideWorldBounds = true;
			dolphin.body.checkCollisions = true;
			dolphin.body.immovable = true;
			dolphin.inputEnabled = true;
			
			// ...and the ring.
			dolphin_ring = game.add.sprite(game.world.width + 200, dolphin.y, 'dolphin_ring');
			game.physics.arcade.enable(dolphin_ring);
			dolphin_ring.body.checkCollisions = true;
			dolphin_ring.body.velocity.x = -100 * dolphin_ringSpeed;
			break;
		case SEAL:
			break;
		case OCTOPUS:
			break;
		default:
			changeRoom(-1);
	}
}
function createCutscene1(myScene){
	// I might use this to create cutscene 1 specifically.
}

/*   Main menu functions
 *   These are the functions that are MAINly (haha) meant for the main menu.
 *   This includes the clickable buttons and the interactive crab guy.
 */
function storyButton(){
	// Open the story mode menu
	changeRoom(1);
}
function arcadeButton(){
	// Open the arcade mode menu
	changeRoom(1001); 
}
function setDifficulty(){
	// Switches between game difficulties (functional, yet inelegant. lol)
	if(difficulty < 2){ difficulty += 1; }
	else { difficulty = 0; }
	setDifficultyButton(difficulty);
}
function setDifficultyButton(myDiff){
	// Switches between game difficulty buttons
	var myString = 'menu_button_'.concat(diffLang[myDiff].toLowerCase());
	menu_button_difficulty = game.add.button(game.world.width / 2 - 64, 272, myString, setDifficulty, this, 0, 0, 1);
	console.log("Difficulty set to: " + diffLang[myDiff] + ".");
}
function menuCrabHide(){
	// Clicking on the crab makes it stop and hide.
	if(!menu_crab_hide){
		menuCrabStop();
		menu_crab_hide = true;
		menu_crab.animations.play('hide');
	}
	// Clicking it again will make it wake up!
	else{
		menu_crab_hide = false;
		menu_crab.animations.play('wake');
	}
}
function menuCrabWalk(){
	// Stores the point where you just clicked to a variable.
	// console.log("Crab is moving!");
	menu_crab_walk_point = game.input.x;
	
	// Make sure crab is awake AND you clicked far away.
	if(!menu_crab_hide && Math.abs((menu_crab.x + (menu_crab.width / 2)) - menu_crab_walk_point) >= 32){
		menu_crab.animations.play('walk');
		
		// menu_crab_walk is the direction the crab is moving (0 if stopped)
		if(menu_crab.x + (menu_crab.width / 2) > menu_crab_walk_point){
			menu_crab_walk = -1;
		}
		else{
			menu_crab_walk = 1;
		}
		
		// Sets the velocity of the crab with a direction.
		menu_crab.body.velocity.x = menu_crab_walk * 200;
	}
}
function menuCrabStop(){
	menu_crab.body.velocity.x = 0;
	menu_crab_walk = 0;
	menu_crab.animations.play('idle');
}
function menuCrabCheck(){
	if(menu_crab_walk){
		if((menu_crab_walk == -1 && menu_crab.x + (menu_crab.width / 2) <= menu_crab_walk_point)
		 || (menu_crab_walk == 1 && menu_crab.x + (menu_crab.width / 2) >= menu_crab_walk_point)){
			menuCrabStop();
		}
		else if(menu_crab.x <= 0){
			menuCrabStop();
			menu_crab.x = 1;
		}
		else if(menu_crab.x >= game.world.width - menu_crab.width){
			menuCrabStop();
			menu_crab.x = game.world.width - menu_crab.width - 1;
		}
	}
}

/*   Dolphin game functions
 *   These functions are specific to the dolphin game.
 *   Some might apply to both Story and Arcade Mode.
 */
function dolphinMove(){
	// This function makes the dolphin move.
	if(game.input.mousePointer.y < (dolphin.height / 2)){
		dolphin.y = 1;
	}
	else if(game.input.mousePointer.y > game.world.height - (dolphin.height / 2)){
		dolphin.y = game.world.height - dolphin.height - 1;
	}
	else{
		dolphin.y = game.input.mousePointer.y - (dolphin.height / 2);
	}
	
	/* OLD CODE WITH SPEED CAP
	if(game.input.mousePointer.y < (dolphin.height / 2)){
		dolphin_move_point = dolphin.height / 2;
	}
	else if(game.input.mousePointer.y > game.world.height - (dolphin.height / 2)){
		dolphin_move_point = game.world.height - (dolphin.height / 2);
	}
	else{
		dolphin_move_point = game.input.mousePointer.y;
	}
	
	if(dolphin.y + (dolphin.height / 2) > dolphin_move_point){
		dolphin_move = -1;
		dolphin.y += dolphin_move - dolphin_acc;
	}
	else if(dolphin.y + (dolphin.height / 2) < dolphin_move_point){
		dolphin_move = 1;
		dolphin.y += dolphin_move + dolphin_acc;
	}
	else{
		dolphinStop();
	}
	
	// Speed cap on dolphin movement
	if(dolphin_acc < 8){
		dolphin_acc += 1;
	} */
}
function dolphinStop(){
	// Makes the dolphin stop.
	dolphin_move = 0;
	dolphin_acc = 0;
	dolphin.y = dolphin_move_point - (dolphin.height / 2);
}
function respawnDolphinRing(myDistance){
	// This function is for making the ring come at the dolphin.
	dolphin_ring.x = game.world.width + myDistance;
	dolphin_ring.y = Math.floor(Math.random() * (game.world.height - dolphin_ring.height));
	dolphin_ring.body.velocity.x = -100 * dolphin_ringSpeed;
}
function dolphinRingCollect(){
	// This happens when the dolphin collects a ring
	dolphin_score += dolphin_ringVal;
	dolphin_regen += dolphin_ringVal;
	var dolphinRingOffsetX = dolphin_ring.x + (dolphin_ring.width / 2);
	var dolphinRingOffsetY = dolphin_ring.y + (dolphin_ring.height / 2);
	makeScore(true, dolphinRingOffsetX, dolphinRingOffsetY, dolphin_ringVal, dolphin_score);
	respawnDolphinRing(10);
}
function dolphinLoseRing(){
	// This is what happens when the ring leaves the screen on the left side
	dolphin_health -= 1;
	dolphin_healthCt.destroy();
	dolphin_healthCt = dolphinHealthCounter();
	dolphin_healthCt.anchor.set(0.5, 0.5);
	
	if(dolphin_health <= 0){
		changeRoom(0);
		console.log(diffLang[difficulty] + " SCORE: " + dolphin_score.toString());
		console.log("");
	}
	else{
		respawnDolphinRing(500);
	}
}
function dolphinRegenCheck(){
	dolphin_regenCt.destroy();
	dolphin_regenCt = dolphinRegenCounter();
	dolphin_regenCt.anchor.set(0.5, 0.5);
	
	if(dolphin_regen >= dolphin_regenVal){
		dolphin_regen = 0;
		dolphin_ringSpeed += 1;
		
		if(dolphin_health < dolphin_maxHealth){
			dolphin_health += 1;
			dolphin_healthCt.destroy();
			dolphin_healthCt = dolphinHealthCounter();
			dolphin_healthCt.anchor.set(0.5, 0.5);
		}
		else{
			dolphin_regen = 0;
			dolphin_score += (dolphin_ringVal * 20);
			makeScore(true, game.world.width / 2, game.world.height / 2, dolphin_ringVal * 20, dolphin_score);
		}
	}
}
function dolphinHealthCounter(){
	var myString = "";
	
	for(x = 0; x < dolphin_health; x++){
		myString = myString.concat("O");
	}
	
	for(y = 0; y < dolphin_maxHealth - dolphin_health; y++){
		myString = myString.concat("X");
	}
	
	return makeText(game.world.width / 2, game.world.height - 15, 0, 40, 0, myString);
}
function dolphinRegenCounter(){
	var myInt = dolphin_regenVal - dolphin_regen;
	var myString = "BONUS IN: " + myInt.toString();
	return makeText(game.world.width / 2, game.world.height - 40, 0, 24, 0, myString);
}

/*   Seal game functions
 *   These functions are specifically for the seal game.
 *   Some might apply to both Story and Arcade Mode.
 */

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
	if(x == -1){ a[0] = game.world.width / 2; }
	else{ a[0] = x; }
	
	// The y position. "-1" is shorthand for centering vertically.
	if(y == -1){ a[1] = game.world.height / 2; }
	else{ a[1] = y; }
	
	/*   FONT
	 *   Different numbers for different fonts.
	 *   Here's a quick reference:
	 *
	 *   0 : Tippins (my handwriting as a font!)
	 *
	 *   The font defaults to Tippins.
	 */
	switch(font){
		case 0:
			a[2] = "Tippins";
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
	 *   0 : BLUE #00F
	 *
	 *   The color defaults to blue.
	 */
	switch(color){
		case 0:
			a[4] = "#00F";
			break;
		default:
			a[4] = "#00F";
	}
			
	return game.add.text(a[0], a[1], myText, { font: a[3], fill: a[4] });
	// To center, use .anchor.set(0.5, 0.5)
}
function dialogue(character, fileStart, fileEnd){
	var charName = "";
	
	// Draw character chathead
	switch(character){
		case PLAYER:
			break;
		case DALE:
			break;
		case EDWIN:
			break;
		default:
			// Default case (called with -1) is for tutorial instructions.
	}
}
function makeScore(doScorePop, x, y, myScore, myTotal){
	// Displays score added at a point ("+100")
	if(doScorePop){
		score_pop.destroy();
		score_pop = makeText(x, y, 0, 24, 0, "+" + myScore.toString());
		score_pop.anchor.set(0.5, 0.5);
		score_popTimer = 30;
	}
	// Updates score counter
	score_count.setText("SCORE: " + myTotal.toString());
}
function popTimerCheck(){
	if(score_popTimer > 0){
		score_popTimer -= 1;
	}
	else if(score_popTimer == 0){
		score_popTimer = -1;
		score_pop.destroy();
	}
}

/*   MAIN LOOP
 *   This is where the magic happens!
 *   The main loop checks for when important variables change throughout gameplay.
 *   Different variables are checked depending on which room you're in.
 *   Because this function is so large, I have included some comments for readability.
 */
function update() {
	switch(room){
		/*   MENU SCREENS   */
		case 0: // Main menu
			menuCrabCheck();
			break;
			
		/*   STORY MODE SCREENS   */
		case 10: // CUTSCENE 1 scene 1
			break;
			
		/*   ARCADE MODE SCREENS   */
		case 1001: // Dolphin game
			dolphinMove();																// Dolphin movement
			game.physics.arcade.collide(dolphin, dolphin_ring, dolphinRingCollect);		// Dolphin ring collision
			dolphinRegenCheck();														// Check for bonus
			popTimerCheck();															// Removing score pop ups
			
			// Dolphin ring respawn
			if(dolphin_ring.x + dolphin_ring.width < 0){
				dolphinLoseRing();
			}
			break;
			
		/*   ERROR   */
		default: // Error: player visits unknown room
			// Do nothing! It's an error.
	}
}