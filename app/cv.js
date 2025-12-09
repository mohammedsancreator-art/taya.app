/*  cv.js
    - clean goal list
    - localStorage persistence
    - confetti canvas + hearts on celebration
*/

(() => {
  const form = document.getElementById('goalForm');
  const input = document.getElementById('goalInput');
  const addBtn = document.getElementById('addBtn');
  const goalsList = document.getElementById('goalsList');
  const clearAllBtn = document.getElementById('clearAll');
  const progressBar = document.getElementById('progressBar');

  const celebration = document.getElementById('celebration');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const heartsContainer = document.getElementById('heartsContainer');
  const closeCelebrate = document.getElementById('closeCelebrate');

  const LS_KEY = 'her_goals_v1';

  // --- data helpers ---
  function loadGoals() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function saveGoals(data){ localStorage.setItem(LS_KEY, JSON.stringify(data)); }

  let goals = loadGoals();

  // --- UI helpers ---
  function render() {
    goalsList.innerHTML = '';
    if (goals.length === 0) {
      goalsList.innerHTML = `<div style="color:#b64a7a;padding:12px;border-radius:10px;background:linear-gradient(180deg,#fff,#fff7fb);text-align:center">متبخلش واكتب !!! </div>`;
      updateProgress();
      return;
    }
    goals.forEach((g, i) => {
      const item = document.createElement('div');
      item.className = 'goal' + (g.done ? ' done' : '');
      item.innerHTML = `
        <div class="goal-text">${escapeHtml(g.text)}</div>
        <button class="icon-btn toggle" title="${g.done ? 'Unmark' : 'Mark done'}" aria-label="toggle done">${g.done ? '↺' : '✓'}</button>
        <button class="icon-btn remove" title="Remove" aria-label="remove">✕</button>
      `;
      // toggle
      item.querySelector('.toggle').addEventListener('click', () => {
        goals[i].done = !goals[i].done;
        saveGoals(goals);
        render();
        checkAllDone();
      });
      // remove
      item.querySelector('.remove').addEventListener('click', () => {
        goals.splice(i,1);
        saveGoals(goals);
        render();
      });

      goalsList.appendChild(item);
    });
    updateProgress();
  }

  function updateProgress(){
    const total = goals.length || 1;
    const done = goals.filter(g => g.done).length;
    const pct = Math.round((done / total) * 100);
    progressBar.style.width = pct + '%';
  }

  // basic html-escape to be safe
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // --- events ---
  form.addEventListener('submit', e => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    goals.unshift({ text: val, done: false, id: Date.now() });
    saveGoals(goals);
    input.value = '';
    render();
  });

  clearAllBtn.addEventListener('click', () => {
    if (!confirm('هل تريد مسح كل الأهداف؟')) return;
    goals = [];
    saveGoals(goals);
    render();
  });

  closeCelebrate.addEventListener('click', () => stopCelebration());

  // initial render
  render();
  checkAllDone();

  // --- celebration logic ---
  function checkAllDone(){
    if (goals.length > 0 && goals.every(g => g.done)) {
      startCelebration();
    }
  }

  // Confetti implementation (simple particle system)
  function startCelebration(){
    // show overlay
    celebration.classList.add('show');
    celebration.setAttribute('aria-hidden', 'false');

    // confetti canvas sizing
    const ctx = confettiCanvas.getContext('2d');
    function fitCanvas(){
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    fitCanvas();
    window.addEventListener('resize', fitCanvas);

    // create particles
    const colors = ['#ff6b83','#ffb6d9','#8de0a6','#ffd166','#ffd4ec'];
    const particles = [];
    const count = Math.min(110, 18 * Math.ceil(window.innerWidth / 200));
    for(let i=0;i<count;i++){
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * -confettiCanvas.height * 0.6,
        r: 6 + Math.random()*8,
        vx: -2 + Math.random()*4,
        vy: 1 + Math.random()*4,
        color: colors[Math.floor(Math.random()*colors.length)],
        angle: Math.random() * Math.PI*2,
        spin: (Math.random()-0.5)*0.2
      });
    }

    let running = true;
    const start = performance.now();

    function step(t){
      if (!running) return;
      const dt = (t - start) / 1000;
      ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
      particles.forEach(p=>{
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // gravity
        p.angle += p.spin;

        // draw small rectangle (rotating)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r*0.6);
        ctx.restore();
      });
      // stop after ~3.2s
      if (t - start < 3200) requestAnimationFrame(step);
      else {
        // fade out then stop
        const fadeStart = performance.now();
        const fadeAnim = function(now){
          const p = Math.min(1, (now - fadeStart) / 500);
          ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
          ctx.globalAlpha = 1 - p;
          particles.forEach(pp=>{
            ctx.save();
            ctx.translate(pp.x, pp.y);
            ctx.rotate(pp.angle);
            ctx.fillStyle = pp.color;
            ctx.fillRect(-pp.r/2, -pp.r/2, pp.r, pp.r*0.6);
            ctx.restore();
          });
          ctx.globalAlpha = 1;
          if (p < 1) requestAnimationFrame(fadeAnim);
          else stopCelebration();
        };
        requestAnimationFrame(fadeAnim);
      }
    }
    requestAnimationFrame(step);

    // spawn floating hearts
    const heartsCount = 14;
    for(let i=0;i<heartsCount;i++){
      setTimeout(()=> spawnHeart(), i*120);
    }
  }

  function spawnHeart(){
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = ['💗','💕','💖','💝'][Math.floor(Math.random()*4)];
    const size = 18 + Math.random()*24;
    heart.style.fontSize = size + 'px';
    heart.style.left = (10 + Math.random()*80) + '%';
    heart.style.bottom = (-10 - Math.random()*20) + 'px';
    heart.style.opacity = 1;
    heartsContainer.appendChild(heart);

    // remove after animation done
    heart.addEventListener('animationend', () => heart.remove());
  }

  function stopCelebration(){
    celebration.classList.remove('show');
    celebration.setAttribute('aria-hidden', 'true');
    // clear hearts
    heartsContainer.innerHTML = '';
    // stop confetti canvas by clearing
    const ctx = confettiCanvas.getContext('2d');
    ctx && ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  }

  // keyboard accessibility: press Enter in input already handled by form submit
  // small improvement: focus input on load
  input.focus();

})();
