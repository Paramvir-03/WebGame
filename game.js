let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let score = 0;
let timeLeft = 60;
let gameInterval, timerInterval, toyCreationInterval;
let toys = [];
let gameDuration = 60;  // Default duration
let maxToys = 5;  // Maximum number of toys on the screen

// Diver character settings (speed is now 1.5x faster)
let character = { x: 400, y: 500, width: 50, height: 50, speed: 7.5, direction: 'down' };  // Speed is increased

// Load sounds
let startSound = document.getElementById("startSound");
let happySound = document.getElementById("happySound");
let unhappySound = document.getElementById("unhappySound");
let endSound = document.getElementById("endSound");

// Load diver image and ensure it's loaded before starting
let diverImage = new Image();
diverImage.src = 'diver.jpeg';  // Replace 'diver.png' with the correct image path

diverImage.onload = function() {
    document.getElementById("startBtn").addEventListener("click", startGame);
};

// Set the time duration
function setTime(seconds) {
    gameDuration = seconds;
    timeLeft = gameDuration;
}

// Create a toy object with different stages
function createToy() {
    let startX = Math.random() * canvas.width;
    let startY = 0;  // Toys fall from the top
    return {
        x: startX,
        y: startY,
        radius: 30,            // Initial size
        minRadius: 15,         // Minimum radius: half of the original size
        initialRadius: 30,     // Store the initial radius for reference
        shrinking: true,       // Stage 1: Toy starts shrinking as it falls
        staying: false,        // Stage 2: Toy stays at the bottom
        rising: false,         // Stage 3: Toy rises and grows
        timer: 0,              // Timer to control stay at the bottom
        speed: 0.5 + Math.random() * 1.5,  // **Slower speed**: Random speed between 0.5 and 2
        collected: false
    };
}


// Draw a toy with gradient effect and shrinking/growing
function drawToys() {
    toys.forEach(toy => {
        if (!toy.collected) {
            let gradient = ctx.createRadialGradient(toy.x, toy.y, toy.radius * 0.5, toy.x, toy.y, toy.radius);
            gradient.addColorStop(0, 'yellow');
            gradient.addColorStop(1, 'orange');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(toy.x, toy.y, toy.radius, 0, Math.PI * 2, false);
            ctx.fill();
        }
    });
}

// Update toy positions and lifecycle
function updateToys() {
    toys.forEach(toy => {
        if (!toy.collected) {
            if (toy.shrinking) {
                // Stage 1: Shrink as it falls, but limit shrinking to half of the initial radius
                toy.y += toy.speed;
                toy.radius = Math.max(toy.minRadius, toy.initialRadius - ((toy.initialRadius - toy.minRadius) * (toy.y / (canvas.height - toy.radius))));

                // If it reaches the bottom, stop shrinking and start the stay timer
                if (toy.y >= canvas.height - toy.radius) {
                    toy.shrinking = false;
                    toy.staying = true;
                    toy.timer = 5 * 60;  // Stay for 5 seconds (5 * 60 frames at 60 FPS)
                }
            } else if (toy.staying) {
                // Stage 2: Stay at the bottom for 5 seconds
                toy.timer--;
                if (toy.timer <= 0) {
                    toy.staying = false;
                    toy.rising = true;  // Start rising after staying
                }
            } else if (toy.rising) {
                // Stage 3: Grow and rise back up
                toy.y -= toy.speed;
                toy.radius = Math.min(toy.initialRadius, toy.minRadius + ((toy.initialRadius - toy.minRadius) * ((canvas.height - toy.y) / canvas.height)));

                // If it reaches the top, restart the cycle and play unhappy sound
                if (toy.y <= 0) {
                    toy.y = 0;
                    toy.radius = toy.initialRadius;
                    toy.shrinking = true;  // Start the cycle again
                    toy.rising = false;
                    unhappySound.play();  // Play unhappy sound when it touches the top edge
                }
            }
        }
    });
}

// Draw the diver based on the current direction
function drawCharacter() {
    ctx.save();  // Save the current canvas state
    ctx.translate(character.x + character.width / 2, character.y + character.height / 2);

    // Rotate or mirror the image based on direction
    if (character.direction === 'left') {
        ctx.scale(-1, 1);  // Flip horizontally
        ctx.translate(-character.width / 2, -character.height / 2);
    } else {
        ctx.translate(-character.width / 2, -character.height / 2);
    }

    ctx.drawImage(diverImage, 0, 0, character.width, character.height);
    ctx.restore();  // Restore the canvas to the original state
}

// Update the score display
function updateScore() {
    document.getElementById("scoreDisplay").innerText = "Score: " + score;
}

// Update the timer display
function updateTimer() {
    document.getElementById("timerDisplay").innerText = "Time Left: " + timeLeft;
}

// Handle character movement and update direction
window.addEventListener("keydown", function(event) {
    switch (event.key) {
        case "ArrowUp": case "w":
            if (character.y > 0) {
                character.y -= character.speed;
                character.direction = 'up';
            }
            break;
        case "ArrowDown": case "s":
            if (character.y < canvas.height - character.height) {
                character.y += character.speed;
                character.direction = 'down';
            }
            break;
        case "ArrowLeft": case "a":
            if (character.x > 0) {
                character.x -= character.speed;
                character.direction = 'left';
            }
            break;
        case "ArrowRight": case "d":
            if (character.x < canvas.width - character.width) {
                character.x += character.speed;
                character.direction = 'right';
            }
            break;
        case " ": collectToy(); break;  // Space key to collect toys
    }
    drawCharacter();  // Re-draw the character at the new position
});

// Check if a toy is collected
function collectToy() {
    toys.forEach((toy, index) => {
        if (!toy.collected && checkCollision(character, toy)) {
            toy.collected = true;
            score++;
            updateScore();
            happySound.play();

            // Remove collected toy and add a new one
            toys.splice(index, 1);  // Remove collected toy
            toys.push(createToy()); // Add a new toy
        }
    });
}

// Check for collision between diver and toy
function checkCollision(character, toy) {
    let distX = character.x + character.width / 2 - toy.x;
    let distY = character.y + character.height / 2 - toy.y;
    let distance = Math.sqrt(distX * distX + distY * distY);
    return distance < character.width / 2 + toy.radius;
}

// Start the game
function startGame() {
    score = 0;
    timeLeft = gameDuration;
    updateScore();
    updateTimer();
    toys = [];  // Empty toys array at the start

    // Add initial 5 toys
    for (let i = 0; i < maxToys; i++) {
        toys.push(createToy());
    }

    // Clear intervals before starting
    if (gameInterval) clearInterval(gameInterval);
    if (timerInterval) clearInterval(timerInterval);

    // Start game loop and timer
    gameInterval = setInterval(gameLoop, 1000 / 60);  // 60 FPS
    timerInterval = setInterval(decrementTimer, 1000);  // 1 second timer

    document.getElementById("startBtn").style.display = "none";
    document.getElementById("restartBtn").style.display = "none";  // Hide restart button at start
    document.getElementById("gameOverOverlay").style.display = "none";  // Hide game over screen
    startSound.play();
}

// Game loop: updates and renders the game every frame
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCharacter();  // Draw the character in the loop
    drawToys();  // Draw the toys
    updateToys();  // Update toy positions and lifecycle
}

// Decrement the timer every second
function decrementTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimer();
    } else {
        endGame();
    }
}

// End the game and provide feedback
function endGame() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    document.getElementById("finalScore").innerText = "Your score is: " + score;

    // Feedback message based on score
    let feedbackMessage;
    if (score >= 15) {
        feedbackMessage = "Amazing! You're a pro at this!";
    } else if (score >= 10) {
        feedbackMessage = "Great Job!";
    } else if (score >= 5) {
        feedbackMessage = "Good effort, keep practicing!";
    } else {
        feedbackMessage = "Keep practicing, you'll get better!";
    }

    document.getElementById("feedbackMessage").innerText = feedbackMessage;

    document.getElementById("gameOverOverlay").style.display = "block";
    document.getElementById("restartBtn").style.display = "block";  // Show restart button after game ends
    endSound.play();
}

// Restart the game
function restartGame() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    startGame();
}
