/* ============================================================
   JuegosYA - Minijuegos jugables (JavaScript puro, sin librerías)
   Juegos: Snake Classic, Candy Match, Basket Shot, Penalty Kings
   ============================================================ */
(function () {
  'use strict';

  const modal = document.getElementById('game-modal');
  const area = document.getElementById('game-area');
  const titleEl = document.getElementById('game-title');
  const closeBtn = document.getElementById('game-close');
  let stopCurrent = null;

  const rand = (n) => Math.floor(Math.random() * n);

  /* ---------------------- SNAKE ---------------------- */
  function startSnake(root) {
    const N = 15, C = 20;
    root.innerHTML =
      '<p class="game-score">Puntos: <span class="js-score">0</span></p>' +
      '<canvas width="300" height="300"></canvas>' +
      '<p class="game-help">Usa las flechas o WASD para moverte</p>' +
      '<div class="touch-pad">' +
      '<button data-d="up">▲</button>' +
      '<div><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button></div>' +
      '</div>' +
      '<button class="btn btn-primary js-restart">Reiniciar</button>';

    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = root.querySelector('.js-score');
    let snake, dir, next, food, score, timer, over;

    function placeFood() {
      do {
        food = { x: rand(N), y: rand(N) };
      } while (snake.some((s) => s.x === food.x && s.y === food.y));
    }

    function reset() {
      snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
      dir = { x: 1, y: 0 };
      next = dir;
      score = 0;
      over = false;
      scoreEl.textContent = 0;
      placeFood();
      clearInterval(timer);
      timer = setInterval(tick, 120);
      draw();
    }

    function tick() {
      dir = next;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (
        head.x < 0 || head.y < 0 || head.x >= N || head.y >= N ||
        snake.some((s) => s.x === head.x && s.y === head.y)
      ) {
        over = true;
        clearInterval(timer);
        draw();
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function draw() {
      ctx.fillStyle = '#1e153b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff4f81';
      ctx.beginPath();
      ctx.arc(food.x * C + C / 2, food.y * C + C / 2, C / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#ffcc00' : '#00d26a';
        ctx.fillRect(s.x * C + 1, s.y * C + 1, C - 2, C - 2);
      });
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('¡Game over!', canvas.width / 2, canvas.height / 2 - 6);
        ctx.font = '16px sans-serif';
        ctx.fillText('Puntos: ' + score, canvas.width / 2, canvas.height / 2 + 22);
      }
    }

    function setDir(dx, dy) {
      if (dx === -dir.x && dy === -dir.y) return; // no girar 180º
      next = { x: dx, y: dy };
    }

    const keys = {
      ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
      ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
      ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
      ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
    };
    const pad = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

    function onKey(e) {
      if (keys[e.key]) {
        e.preventDefault();
        setDir(keys[e.key][0], keys[e.key][1]);
      }
    }
    function onPad(e) {
      const b = e.target.closest('button[data-d]');
      if (b) setDir(pad[b.dataset.d][0], pad[b.dataset.d][1]);
    }

    document.addEventListener('keydown', onKey);
    root.querySelector('.touch-pad').addEventListener('click', onPad);
    root.querySelector('.js-restart').addEventListener('click', reset);
    reset();

    return function stop() {
      clearInterval(timer);
      document.removeEventListener('keydown', onKey);
    };
  }

  /* ---------------------- CANDY MATCH (memoria) ---------------------- */
  function startMemory(root) {
    const icons = ['🍬', '🍭', '🍫', '🍩', '🍪', '🍰', '🍎', '🍓'];
    root.innerHTML =
      '<p class="game-score">Movimientos: <span class="js-moves">0</span> · Parejas: <span class="js-pairs">0</span>/8</p>' +
      '<div class="memory-grid"></div>' +
      '<p class="game-msg js-msg">Encuentra todas las parejas</p>' +
      '<button class="btn btn-primary js-restart">Reiniciar</button>';

    const grid = root.querySelector('.memory-grid');
    const movesEl = root.querySelector('.js-moves');
    const pairsEl = root.querySelector('.js-pairs');
    const msgEl = root.querySelector('.js-msg');
    let first, lock, moves, pairs, t;

    function reset() {
      const deck = icons.concat(icons);
      for (let i = deck.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      grid.innerHTML = '';
      deck.forEach((icon) => {
        const b = document.createElement('button');
        b.className = 'memory-card';
        b.dataset.icon = icon;
        b.textContent = '❓';
        grid.appendChild(b);
      });
      first = null; lock = false; moves = 0; pairs = 0;
      movesEl.textContent = 0;
      pairsEl.textContent = 0;
      msgEl.textContent = 'Encuentra todas las parejas';
    }

    function onClick(e) {
      const card = e.target.closest('.memory-card');
      if (!card || lock || card === first || card.classList.contains('done')) return;
      card.textContent = card.dataset.icon;
      card.classList.add('flipped');
      if (!first) { first = card; return; }
      moves++;
      movesEl.textContent = moves;
      if (first.dataset.icon === card.dataset.icon) {
        first.classList.add('done');
        card.classList.add('done');
        first = null;
        pairs++;
        pairsEl.textContent = pairs;
        if (pairs === icons.length) msgEl.textContent = '🎉 ¡Ganaste en ' + moves + ' movimientos!';
      } else {
        lock = true;
        const a = first, b = card;
        first = null;
        t = setTimeout(() => {
          a.textContent = '❓'; b.textContent = '❓';
          a.classList.remove('flipped'); b.classList.remove('flipped');
          lock = false;
        }, 700);
      }
    }

    grid.addEventListener('click', onClick);
    root.querySelector('.js-restart').addEventListener('click', () => { clearTimeout(t); reset(); });
    reset();

    return function stop() { clearTimeout(t); };
  }

  /* ---------------------- BASKET SHOT (timing) ---------------------- */
  function startBasket(root) {
    const TOTAL = 10;
    root.innerHTML =
      '<p class="game-score">Tiros: <span class="js-shots">0</span>/' + TOTAL +
      ' · Canastas: <span class="js-score">0</span></p>' +
      '<div class="power-bar"><div class="power-zone"></div><div class="power-marker"></div></div>' +
      '<p class="game-msg js-msg">Pulsa «Lanzar» (o la barra espaciadora) cuando la marca esté en la zona verde</p>' +
      '<button class="btn btn-primary js-shoot">🏀 Lanzar</button>';

    const marker = root.querySelector('.power-marker');
    const shotsEl = root.querySelector('.js-shots');
    const scoreEl = root.querySelector('.js-score');
    const msgEl = root.querySelector('.js-msg');
    const shootBtn = root.querySelector('.js-shoot');
    let pos, dir, speed, shots, score, raf, last, finished;

    function reset() {
      pos = 0; dir = 1; speed = 0.05; shots = 0; score = 0; finished = false;
      shotsEl.textContent = 0; scoreEl.textContent = 0;
      msgEl.textContent = 'Pulsa «Lanzar» (o la barra espaciadora) cuando la marca esté en la zona verde';
      shootBtn.textContent = '🏀 Lanzar';
      last = null;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }

    function loop(ts) {
      if (last === null) last = ts;
      const dt = ts - last;
      last = ts;
      pos += dir * speed * dt;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      marker.style.left = pos + '%';
      raf = requestAnimationFrame(loop);
    }

    function shoot() {
      if (finished) { reset(); return; }
      shots++;
      shotsEl.textContent = shots;
      if (pos >= 40 && pos <= 60) {
        score++;
        scoreEl.textContent = score;
        msgEl.textContent = '🏀 ¡Canasta!';
      } else {
        msgEl.textContent = '❌ Has fallado';
      }
      speed += 0.006;
      if (shots >= TOTAL) {
        finished = true;
        cancelAnimationFrame(raf);
        msgEl.textContent = 'Fin del juego: ' + score + ' canastas de ' + TOTAL;
        shootBtn.textContent = '🔁 Jugar otra vez';
      }
    }

    function onKey(e) {
      if (e.code === 'Space') { e.preventDefault(); shoot(); }
    }

    shootBtn.addEventListener('click', shoot);
    document.addEventListener('keydown', onKey);
    reset();

    return function stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
    };
  }

  /* ---------------------- PENALTY KINGS ---------------------- */
  function startPenalty(root) {
    const ROUNDS = 5;
    root.innerHTML =
      '<p class="game-score">Ronda <span class="js-round">1</span>/' + ROUNDS +
      ' · Goles: <span class="js-score">0</span></p>' +
      '<div class="goal"><div class="goal-cell"></div><div class="goal-cell"></div><div class="goal-cell"></div></div>' +
      '<p class="game-msg js-msg">Elige dónde chutar</p>' +
      '<div class="penalty-btns">' +
      '<button class="btn btn-primary" data-p="0">⬅ Izquierda</button>' +
      '<button class="btn btn-primary" data-p="1">⬆ Centro</button>' +
      '<button class="btn btn-primary" data-p="2">➡ Derecha</button>' +
      '</div>' +
      '<button class="btn btn-primary js-restart" hidden>🔁 Jugar otra vez</button>';

    const cells = root.querySelectorAll('.goal-cell');
    const roundEl = root.querySelector('.js-round');
    const scoreEl = root.querySelector('.js-score');
    const msgEl = root.querySelector('.js-msg');
    const btns = root.querySelector('.penalty-btns');
    const again = root.querySelector('.js-restart');
    let round, score;

    function clearGoal() { cells.forEach((c) => (c.textContent = '')); }

    function reset() {
      round = 1; score = 0;
      roundEl.textContent = 1; scoreEl.textContent = 0;
      msgEl.textContent = 'Elige dónde chutar';
      clearGoal();
      btns.hidden = false;
      again.hidden = true;
    }

    function onShoot(e) {
      const b = e.target.closest('button[data-p]');
      if (!b) return;
      const shot = Number(b.dataset.p);
      const keeper = rand(3);
      clearGoal();
      cells[keeper].textContent = '🧤';
      if (shot === keeper) {
        cells[shot].textContent = '🧤⚽';
        msgEl.textContent = '🧤 ¡Parada del portero!';
      } else {
        cells[shot].textContent = '⚽';
        score++;
        scoreEl.textContent = score;
        msgEl.textContent = '⚽ ¡GOOOL!';
      }
      if (round >= ROUNDS) {
        msgEl.textContent += '  Final: ' + score + '/' + ROUNDS + ' goles';
        btns.hidden = true;
        again.hidden = false;
      } else {
        round++;
        roundEl.textContent = round;
      }
    }

    btns.addEventListener('click', onShoot);
    again.addEventListener('click', reset);
    reset();

    return function stop() {};
  }

  /* ---------------------- Catálogo de juegos ---------------------- */
  const games = {
    snake: startSnake,
    memory: startMemory,
    basket: startBasket,
    penalty: startPenalty
  };

  /* ---------------------- Modal ---------------------- */
  function openGame(id, title) {
    closeGame();
    titleEl.textContent = title;
    area.innerHTML = '';
    modal.hidden = false;
    document.body.classList.add('modal-open');
    if (games[id]) {
      stopCurrent = games[id](area);
    } else {
      area.innerHTML = '<p class="game-msg">🚧 Este juego estará disponible próximamente.</p>';
    }
  }

  function closeGame() {
    if (stopCurrent) { stopCurrent(); stopCurrent = null; }
    area.innerHTML = '';
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('.game-card a');
    if (!link) return;
    e.preventDefault();
    openGame(link.dataset.game, link.querySelector('h3').textContent);
  });

  closeBtn.addEventListener('click', closeGame);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeGame();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeGame();
  });
})();