let level = 1;
let timeLeft = 100;
let timerInt, bossInt;
const sndJscare = document.getElementById('snd-jscare');
const sndLoop = document.getElementById('snd-loop');

// Sound-Lautstärke begrenzen (Schutz für Kopfhörer)
sndJscare.volume = 0.6; 
sndLoop.volume = 0.4;

function initGame() {
    document.getElementById('start-screen').style.display = 'none';
    loadLevel();
}

function loadLevel() {
    const container = document.getElementById('task-container');
    const view = document.getElementById('task-view');
    view.style.display = 'flex';
    container.innerHTML = '';
    document.getElementById('depth-val').innerText = "0" + level;

    if (level === 1) { // Wires
        for(let i=0; i<3; i++) {
            let w = document.createElement('div');
            w.style = "width:40px; height:40px; border:2px solid #24ff15; margin:10px; cursor:pointer;";
            w.onclick = function() {
                this.style.background = "#24ff15";
                if([...container.children].every(c => c.style.background)) nextLevel();
            }
            container.appendChild(w);
        }
    } else if (level === 2) { // Sequence
        let goal = 1;
        [1,2,3].sort(()=>Math.random()-0.5).forEach(n => {
            let b = document.createElement('button');
            b.innerText = n; b.className = "btn";
            b.onclick = () => {
                if(n === goal) { b.style.opacity = 0.2; goal++; if(goal > 3) nextLevel(); }
                else triggerFail();
            };
            container.appendChild(b);
        });
    } else if (level === 3) { // Timing
        let bar = document.createElement('div');
        bar.style = "width:200px; height:20px; border:1px solid #24ff15; position:relative;";
        let pointer = document.createElement('div');
        pointer.style = "width:10px; height:100%; background:red; position:absolute; left:0;";
        let pos = 0; let dir = 1;
        let anim = setInterval(() => {
            pos += dir * 2; if(pos > 190 || pos < 0) dir *= -1;
            pointer.style.left = pos + "px";
        }, 20);
        bar.onclick = () => {
            clearInterval(anim);
            if(pos > 80 && pos < 120) nextLevel(); else triggerFail();
        };
        bar.appendChild(pointer); container.appendChild(bar);
    } else if (level === 4) { // Fast Click
        let clicks = 0;
        let b = document.createElement('button');
        b.className = "btn"; b.innerText = "TAP 10x";
        b.onclick = () => { clicks++; b.innerText = (10-clicks) + "x LEFT"; if(clicks >= 10) nextLevel(); };
        container.appendChild(b);
    } else {
        view.style.display = 'none';
        runTerminalLevel();
        return;
    }

    startTimer(10 - level);
}

function startTimer(sec) {
    timeLeft = 100;
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        timeLeft -= (0.1 / sec) * 100;
        document.getElementById('timer-bar').style.width = timeLeft + "%";
        if (timeLeft <= 0) triggerFail();
    }, 100);
}

function nextLevel() {
    level++;
    loadLevel();
}

async function runTerminalLevel() {
    document.getElementById('terminal-view').style.display = 'flex';
    let prog = 0;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const loop = setInterval(() => {
            prog += 0.5;
            document.getElementById('upload-progress').style.width = prog + "%";
            analyser.getByteFrequencyData(data);
            let vol = data.reduce((a,b)=>a+b)/data.length;
            if(vol > 50) { clearInterval(loop); stream.getTracks().forEach(t=>t.stop()); triggerFail(); }
            if(prog >= 100) { clearInterval(loop); stream.getTracks().forEach(t=>t.stop()); runBoss(); }
        }, 50);
    } catch(e) { triggerFail(); }
}

function runBoss() {
    document.getElementById('terminal-view').style.display = 'none';
    document.getElementById('boss-view').style.display = 'flex';
    let size = 10;
    const cre = document.getElementById('creature-silhouette');
    bossInt = setInterval(() => {
        size += 3;
        cre.style.width = size + "px"; cre.style.height = size + "px";
        cre.style.opacity = size / 200;
        if(size > 300) triggerFail();
    }, 30);

    document.getElementById('boss-view').onclick = () => {
        clearInterval(bossInt);
        document.getElementById('knife-img').style.transform = "translateY(-100px) rotate(-20deg)";
        if(size > 80 && size < 150) {
            document.getElementById('boss-view').style.display = 'none';
            document.getElementById('victory-layer').style.display = 'flex';
        } else triggerFail();
    };
}

function triggerFail() {
    clearInterval(timerInt); clearInterval(bossInt);
    document.getElementById('jumpscare-layer').style.display = 'block';
    sndJscare.play();
    setTimeout(() => {
        document.getElementById('jumpscare-layer').style.display = 'none';
        const fail = document.getElementById('fail-layer');
        fail.style.display = 'block';
        sndLoop.play();
        fail.innerText = "NEVER COME BACK ".repeat(1000);
    }, 1000);
}
