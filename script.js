const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600; // 擴大畫布寬度
canvas.height = 400; // 擴大畫布高度

let ballRadius = 10;
let x, y;
let dx, dy;
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX;
let rightPressed = false;
let leftPressed = false;
let brickRowCount = 3; // 預設行數
let brickColumnCount = 5; // 預設列數
let brickWidth = 75;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft; // 磚塊偏移
let score = 0;
let lives = 3; // 固定生命數
let bricks = [];
let gameOver = false;
let difficulty = 'easy'; // 預設難度為簡單

// 設置特殊磚塊的生成機率
function getSpecialBrickChance() {
    switch (difficulty) {
        case 'easy':
            return 0.25; // 簡單：25%
        case 'medium':
            return 0.5; // 中等：50%
        case 'hard':
            return 0.8; // 困難：80%
        default:
            return 0; // 預設為 0%
    }
}

// 磚塊設置
function setupBricks() {
    brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding) - brickPadding)) / 2; // 磚塊偏移
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const isSpecial = Math.random() < getSpecialBrickChance(); // 根據機率生成特殊磚塊
            const hitsNeeded = isSpecial ? Math.floor(Math.random() * 2) + 2 : 1; // 特殊磚塊需要2-3次擊打
            bricks[c][r] = { x: 0, y: 0, status: 1, hitsNeeded: hitsNeeded };
        }
    }

    // 計算每個磚塊的位置，從中心開始生成
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            b.x = brickOffsetLeft + c * (brickWidth + brickPadding);
            b.y = brickOffsetTop + r * (brickHeight + brickPadding);
        }
    }
}

// 繪製磚塊
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                // 根據擊打次數改變顏色
                if (b.hitsNeeded > 1) {
                    ctx.fillStyle = '#FF5733'; // 特殊磚塊顏色
                    ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(b.hitsNeeded, b.x + brickWidth / 2 - 5, b.y + brickHeight / 2 + 5);
                } else {
                    ctx.fillStyle = '#0095DD'; // 普通磚塊顏色
                    ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
                }
            }
        }
    }
}

// 繪製球
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

// 繪製擋板
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

// 繪製分數
function drawScore() {
    document.getElementById('score').innerText = '分數: ' + score;
}

// 繪製生命數
function drawLives() {
    document.getElementById('lives').innerText = '生命: ' + lives;
}

// 碰撞檢測
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.hitsNeeded--;
                    if (b.hitsNeeded <= 0) {
                        b.status = 0;
                        score++;
                    }
                    drawScore();

                    // 判斷是否過關
                    if ((difficulty === 'easy' && score >= 15) ||
                        (difficulty === 'medium' && score >= 25) ||
                        (difficulty === 'hard' && score >= 35)) {
                        // 顯示過關動畫
                        showLevelCompleteAnimation();
                        return; // 結束函數執行
                    }
                }
            }
        }
    }
}
function showLevelCompleteAnimation() {
    // 暫停遊戲
    isGamePaused = true;

    // 顯示 SweetAlert2 的過關動畫
    Swal.fire({
        title: '過關！',
        text: '恭喜你過關！',
        icon: 'success',
        showCancelButton: false, // 不顯示取消按鈕
        confirmButtonText: '重新開始', // 確認按鈕文本
        onBeforeOpen: () => {
            // 可選：在顯示動畫前的操作
        }
    }).then((result) => {
        if (result.isConfirmed) {
            location.reload();
        }
    });
}


// 新增尾跡的變數
let tail = [];

// 繪製遊戲
function draw() {
    if (gameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製尾跡
    for (let i = 0; i < tail.length; i++) {
        ctx.fillStyle = `rgba(0, 149, 221, ${1 - (i / tail.length)})`; // 逐漸透明
        const width = 10; // 錐體的寬度

        ctx.beginPath();
        ctx.moveTo(tail[i].x, tail[i].y); // 尾跡的尖端
        ctx.lineTo(tail[i].x - width, tail[i].y + ballRadius); // 左側
        ctx.lineTo(tail[i].x + width, tail[i].y + ballRadius); // 右側
        ctx.closePath();
        ctx.fill();
    }

    // 更新尾跡
    tail.push({x: x, y: y}); // 將當前球的位置推入尾跡
    if (tail.length > 10) { // 控制尾跡的數量
        tail.shift(); // 移除最舊的尾跡
    }

    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    drawLives();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            lives--; // 失去一條生命
            drawLives();
            if (lives <= 0) {
                alert('遊戲結束！你的分數是：' + score);
                gameOver = true;
                document.getElementById('restartBtn').style.display = 'block';
                return;
            }
            // 重設球的位置
            x = canvas.width / 2;
            y = canvas.height - 30;
            switch (difficulty) {
                case 'easy':
                    dx = 2;
                    dy = -2;
                    break;
                case 'medium':
                    dx = 3;
                    dy = -3;
                    break;
                case 'hard':
                    dx = 4;
                    dy = -4;
                    brickRowCount = 5; // 困難難度行數
                    brickColumnCount = 7; // 困難難度列數
                    break;
            }
            paddleX = (canvas.width - paddleWidth) / 2;
        }
    }

    x += dx;
    y += dy;

    requestAnimationFrame(draw);
}




// 控制擋板
document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
});
document.addEventListener('mousemove', (e) => {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
});

// 選擇遊戲難度
document.querySelectorAll('.difficultyBtn').forEach(button => {
    button.addEventListener('click', () => {
        difficulty = button.getAttribute('data-difficulty');
        setupGame();
        document.getElementById('difficultySelection').style.display = 'none'; // 隱藏難度選擇按鈕
        document.getElementById('gameCanvas').style.display = 'block'; // 顯示畫布
        document.getElementById('score').style.display = 'block'; // 顯示分數
        document.getElementById('lives').style.display = 'block'; // 顯示生命數
    });
});

// 設定遊戲
function setupGame() {
    switch (difficulty) {
        case 'easy':
            dx = 2;
            dy = -2;
            brickRowCount = 3; // 簡單難度行數
            brickColumnCount = 5; // 簡單難度列數
            break;
        case 'medium':
            dx = 3;
            dy = -3;
            brickRowCount = 5; // 中等難度行數
            brickColumnCount = 5; // 中等難度列數
            break;
        case 'hard':
            dx = 4;
            dy = -4;
            brickRowCount = 5; // 困難難度行數
            brickColumnCount = 7; // 困難難度列數
            break;
    }
    x = canvas.width / 2;
    y = canvas.height - 30;
    paddleX = (canvas.width - paddleWidth) / 2;
    score = 0;
    lives = 3;
    gameOver = false;
    bricks = [];
    setupBricks();
    draw();
}

// 重新開始遊戲
document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('restartBtn').style.display = 'none'; // 隱藏重啟按鈕
    location.reload(); // 重新開始遊戲
});

// 初始化遊戲
setupGame();
