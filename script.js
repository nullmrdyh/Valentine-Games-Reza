const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameActive = false, score = 0, cameraY = 0;
let platforms = [], clouds = [];

const fox = { 
    x: canvas.width/2 - 25, y: canvas.height - 150, 
    w: 55, h: 55, vx: 0, vy: 0, 
    jump: -17.5, gravity: 0.65,
    facingRight: true 
};

function initGame() {
    cameraY = 0; score = 0; scoreEl.innerText = 0;
    fox.x = canvas.width / 2 - 25;
    fox.y = canvas.height - 150;
    fox.vy = 0;
    
    clouds = [];
    for(let i=0; i<10; i++) {
        clouds.push({ x: Math.random()*canvas.width, y: -i*450, s: Math.random()*40+60, speed: 0.2 + Math.random()*0.3 });
    }

    platforms = [];
    // Dasar Rumput
    platforms.push({ x: 0, y: canvas.height - 60, w: canvas.width, h: 600, type: 'grass' });

    // Pijakan Tangga (16 buah)
    for(let i=1; i<=16; i++) {
        platforms.push({
            x: (i % 2 === 0) ? canvas.width * 0.15 : canvas.width * 0.6,
            y: (canvas.height - 60) - (i * 180),
            w: 120, h: 25,
            hasLove: i <= 15,
            isGoal: i === 16
        });
    }
}

let moveDir = 0;
const updateDir = (x) => {
    moveDir = x < canvas.width/2 ? -1 : 1;
    fox.facingRight = moveDir === 1;
};
window.addEventListener('touchstart', e => updateDir(e.touches[0].clientX));
window.addEventListener('touchend', () => moveDir = 0);
window.addEventListener('mousedown', e => updateDir(e.clientX));
window.addEventListener('mouseup', () => moveDir = 0);

function update() {
    if(!gameActive) return;

    fox.vx = moveDir * 7.5;
    fox.vy += fox.gravity;
    fox.x += fox.vx; fox.y += fox.vy;

    // Wrap-around horizontal
    if(fox.x > canvas.width) fox.x = -fox.w;
    if(fox.x < -fox.w) fox.x = canvas.width;

    // Deteksi Tabrakan
    if(fox.vy > 0) {
        platforms.forEach(p => {
            if(fox.x + fox.w*0.7 > p.x && fox.x + fox.w*0.3 < p.x + p.w && 
               fox.y + fox.h > p.y && fox.y + fox.h < p.y + p.h + 15) {
                fox.vy = fox.jump;
                document.getElementById('jumpSound').currentTime = 0;
                document.getElementById('jumpSound').play();
                if(p.hasLove) {
                    p.hasLove = false;
                    score++;
                    scoreEl.innerText = score;
                    
                }
                if(p.isGoal && score >= 15) {
                    gameActive = false;
                    document.getElementById('win-screen').style.display = 'block';
                    document.getElementById('hud').style.display = 'none';
                }
            }
        });
    }

    // Kamera Geser Stabil
    let triggerLine = cameraY + canvas.height * 0.45;
    if (fox.y < triggerLine) {
        cameraY = fox.y - canvas.height * 0.45;
    }

    // LOGIKA PENGULANGAN JIKA JATUH
    if (fox.y > cameraY + canvas.height + 100) {
        // Efek Reset Game
        initGame();
    }

    clouds.forEach(c => {
        c.x += c.speed;
        if(c.x > canvas.width + 100) c.x = -150;
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background Langit
    let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#4fa4ff'); sky.addColorStop(1, '#e6f3ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(0, -cameraY);

    // Awan
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    clouds.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.s*0.5, 0, Math.PI*2);
        ctx.arc(c.x+c.s*0.4, c.y-c.s*0.2, c.s*0.4, 0, Math.PI*2);
        ctx.fill();
    });

    // Pijakan (Solid)
    platforms.forEach(p => {
        if(p.type === 'grass') {
            ctx.fillStyle = '#2d5a27';
            ctx.fillRect(p.x, p.y, p.w, 800);
        } else {
            // Shadow Pijakan
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(p.x + 4, p.y + 4, p.w, p.h);
            // Warna Kayu Solid
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, 5);
            ctx.fill();
        }

        if(p.hasLove) {
            ctx.font = "34px Arial";
            ctx.fillText("❤️", p.x + p.w/2 - 17, p.y - 15);
        }
        if(p.isGoal) {
            ctx.font = "60px Arial";
            ctx.fillText("🐰", p.x + p.w/2 - 30, p.y - 20);
        }
    });

    // FOX - WARNA TEGAS & SOLID
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.translate(fox.x + fox.w/2, fox.y + fox.h/2);
    if(!fox.facingRight) ctx.scale(-1, 1);
    
    // Memberikan garis tepi halus agar warna rubah lebih 'pop'
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.font = "55px Arial";
    ctx.strokeText("🦊", -fox.w/2, fox.h/2 - 5);
    ctx.fillText("🦊", -fox.w/2, fox.h/2 - 5);
    
    ctx.restore();

    ctx.restore();
}

document.getElementById('start-btn').onclick = () => {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    const bg = document.getElementById('bgMusic');
    bg.volume = 0.2; 
    document.getElementById('jumpSound').volume = 0.1;
    bg.play();
    gameActive = true;
    initGame();
    update();
};
