// Drawing Objects
var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

// Paddle
var paddle = new Paddle(75, 10, (canvas.width - 75) / 2, canvas.height - 10, 7);

// Ball
var ball = new Ball(canvas.width / 2, canvas.height - 20, 10, '#0095DD');
ball.velocity = new Velocity(2, -2);
var keyboardState = {
  leftPressed: false,
  rightPressed: false,
};

// Bricks
var brickParams = {
  brickRowCount: 3,
  brickColumnCount: 5,
  brickWidth: 75,
  brickHeight: 20,
  brickPadding: 10,
  brickOffsetTop: 30,
  brickOffsetLeft: 30,
};

// Key listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);

function mouseMoveHandler(e){
  var relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width){
    paddle.x = relativeX - paddle.width / 2;
  }
}

var gameComponents = {
  ball: ball,
  paddle: paddle,
  blocks: initializeBricks(brickParams),
};

setInterval(iterate, 10, canvas, context, gameComponents);

function iterate(canvas, context, gameComponents){
  var pointsEarned = updatePositions(canvas, gameComponents);

  if (!updatePositions(canvas, gameComponents))
  {
    gameOver(true);
  }
  draw(canvas, context, gameComponents);
}

function updatePositions(canvas, gameComponents){
  gameComponents.ball.update(canvas);
  gameComponents.paddle.update(canvas);

  var isAnyBlockLeft = false;
  for (block of gameComponents.blocks){
    if (block.update(ball))
      isAnyBlockLeft = true;
  }
  return isAnyBlockLeft;
}

function draw(canvas, context, stuff){
  context.clearRect(0, 0, canvas.width, canvas.height);
  gameComponents.ball.show(context);
  gameComponents.paddle.show(context);
  var score = 0;
  for (block of gameComponents.blocks){
    block.show(context);
    if (!block.isActive)
      score += 10;
  }
  drawScore(context, score);
}

function drawScore(context, score){
  context.font = "16px Arial";
  context.fillStyle = "#0095DD";
  context.fillText("Score: " + score, 8, 20);
}

function gameOver(isWin = false){
  if (isWin)
    alert("Congratulations, you win!");
  else
    alert("Game Over!");
  document.location.reload();
}

function Velocity(dx, dy){
  this.dx = dx;
  this.dy = dy;
}

function Ball(x, y, radius, color){
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.color = color;
  this.velocity = new Velocity(0, 0);
}

Ball.prototype.checkCollision = function(brick){
  return false;
}

Ball.prototype.update = function(canvas){
  this.x += this.velocity.dx;

  var effectiveWidth = canvas.width - this.radius;
  if (this.x > effectiveWidth){
    this.x = 2 * effectiveWidth - this.x;
    this.velocity.dx *= -1;
  }

  if (this.x < this.radius){
    this.x = 2 * this.radius - this.x;
    this.velocity.dx *= -1;
  }

  this.y += this.velocity.dy;
  var effectiveHeight = canvas.height - this.radius;
  if (this.y > (effectiveHeight - paddle.height)){

    // Check for collision with paddle
    if (this.x >= paddle.x && this.x <= paddle.x + paddle.width){
      this.y = 2 * (effectiveHeight - paddle.height) - this.y;
      this.velocity.dy *= -1;  
    }
    else if (this.y > effectiveHeight){
      gameOver();
    }
  }

  if (this.y < this.radius){
    this.y = 2 * this.radius - this.y;
    this.velocity.dy *= -1;
  }
}

Ball.prototype.show = function(context){
  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
  context.fillStyle = ball.color;
  context.fill();
  context.closePath();
}

Ball.prototype.isOutOfBounds = function(){
  return this.x < 0 || this.y < 0;
}

function Paddle(width, height, x, y, speed){
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.speed = speed;
}

Paddle.prototype.update = function(){
  if (keyboardState.leftPressed){
    this.x = this.x > this.speed
      ? this.x - this.speed
      : 0;
  }
  else if (keyboardState.rightPressed){
    this.x = this.x < canvas.width - this.width - this.speed
      ? this.x + this.speed
      : canvas.width - this.width;
  }
}

Paddle.prototype.show = function(context){
  context.beginPath();
  context.rect(this.x, this.y, this.width, this.height);
  context.fillStyle = "#0095DD";
  context.fill();
  context.closePath();
}

function Brick(width, height, x, y){
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.isActive = true;
}

Brick.prototype.ballIsToLeft = function(ball){
  return ball.x - ball.radius - this.width <= this.x;
}

Brick.prototype.ballIsToRight = function(ball){
  return ball.x + ball.radius >= this.x;
}

Brick.prototype.isHorizontallyOverlapped = function(ball){
  return this.ballIsToLeft(ball) && this.ballIsToRight(ball);
}

Brick.prototype.ballIsAbove = function(ball){
  return ball.y - ball.radius - this.height <= this.y;
}

Brick.prototype.ballIsBelow = function(ball){
  return ball.y + ball.radius >= this.y;
}

Brick.prototype.isVerticallyOverlapped = function(ball){
  return this.ballIsAbove(ball) && this.ballIsBelow(ball);
}

Brick.prototype.isCollision = function(ball){
  return this.isHorizontallyOverlapped(ball)
         && this.isVerticallyOverlapped(ball); 
}

Brick.prototype.update = function(ball){
  if (!this.isActive) return false;

  if (!this.isCollision(ball)) return true;
  
  return this.isActive = false;
}

Brick.prototype.show = function(context){
  if (!this.isActive) return;

  context.beginPath();
  context.rect(this.x, this.y, this.width, this.height);
  context.fillStyle = "#0095DD";
  context.fill();
  context.closePath();
}

function keyDownHandler(e){
  if (e.keyCode == 39){
    keyboardState.rightPressed = true;
  }
  else if (e.keyCode == 37){
    keyboardState.leftPressed = true;
  }
}

function keyUpHandler(e){
  if (e.keyCode == 39){
    keyboardState.rightPressed = false;
  }
  else if (e.keyCode == 37){
    keyboardState.leftPressed = false;
  }
}

function initializeBricks(params){
  var output = [];
  var brickX = 0;
  var brickY = 0;
  for (c = 0; c < params.brickColumnCount; c++){
    for (r = 0; r < params.brickRowCount; r++){
      brickX = c * (params.brickWidth + params.brickPadding) + params.brickOffsetLeft;
      brickY = r * (params.brickHeight + params.brickPadding) + params.brickOffsetTop;
      output.push(new Brick(params.brickWidth, params.brickHeight, brickX, brickY));
    }
  }
  return output;
}