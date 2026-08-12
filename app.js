const playerId = getOrCreatePlayerId();
let gameCode = null;
let myName = null;
let processedRounds = {};

const joinCard = document.getElementById('joinCard');
const gameCard = document.getElementById('gameCard');
const leaderboardCard = document.getElementById('leaderboardCard');
const roundBadge = document.getElementById('roundBadge');
const statusLine = document.getElementById('statusLine');
const optionsGrid = document.getElementById('optionsGrid');
const resultLine = document.getElementById('resultLine');
const joinError = document.getElementById('joinError');

document.getElementById('joinBtn').onclick = async () => {
  const name = document.getElementById('nameInput').value.trim();
  const code = document.getElementById('codeInput').value.trim().toUpperCase();
  if (!name || !code) { joinError.textContent = 'Enter your name and the game code.'; return; }

  const snap = await gameRef(code).get();
  if (!snap.exists()) { joinError.textContent = 'Game not found. Check the code.'; return; }

  gameCode = code;
  myName = name;
  localStorage.setItem('gn_game_code', code);

  const existing = (await playersRef(gameCode).child(playerId).get()).val() || {};
  await playersRef(gameCode).child(playerId).update({
    name: myName,
    eliminated: existing.eliminated || false,
    isAdmin: false,
    joinedAt: existing.joinedAt || Date.now()
  });

  joinCard.style.display = 'none';
  gameCard.style.display = 'block';
  listenToGame();
};

function listenToGame() {
  gameRef(gameCode).on('value', (snap) => {
    const g = snap.val();
    if (!g) return;

    if (g.status === 'lobby') {
      roundBadge.textContent = 'Waiting for host to start...';
      const count = Object.keys(g.players || {}).length;
      statusLine.textContent = `${count} player(s) joined`;
      optionsGrid.innerHTML = '';
      resultLine.textContent = '';
      leaderboardCard.style.display = 'none';
    } else if (g.status === 'in_progress') {
      renderRound(g);
    } else if (g.status === 'finished') {
      showFinal(g.players);
    }
  });
}

function renderRound(g) {
  const r = g.currentRound;
  const round = (g.rounds || {})[r];
  const me = (g.players || {})[playerId] || {};
  if (!round) return;

  roundBadge.textContent = `Round ${r} of ${TOTAL_ROUNDS} — ${round.theme}`;

  if (me.eliminated) {
    statusLine.textContent = "You're eliminated — spectating the rest of the game.";
    optionsGrid.innerHTML = '';
    resultLine.textContent = '';
    round.options.forEach(opt => {
      const tag = document.createElement('div');
      tag.className = 'option-btn taken';
      if (round.revealed && opt === round.adminPick) tag.classList.add('target');
      tag.textContent = opt;
      optionsGrid.appendChild(tag);
    });
    return;
  }

  const picks = round.picks || {};
  const myPick = picks[playerId] || null;

  optionsGrid.innerHTML = '';
  round.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (opt === myPick) btn.classList.add('mine');
    if (round.revealed && opt === round.adminPick) btn.classList.add('target');
    btn.textContent = opt;
    btn.disabled = !!myPick || round.revealed;
    btn.onclick = () => makePick(r, opt);
    optionsGrid.appendChild(btn);
  });

  if (!round.revealed) {
    statusLine.textContent = myPick
      ? `You picked ${myPick}. Waiting for the host to reveal...`
      : `Pick one — avoid whatever ${ADMIN_DISPLAY_NAME} picks.`;
    resultLine.textContent = '';
  } else {
    statusLine.textContent = `${ADMIN_DISPLAY_NAME} picked ${round.adminPick}.`;
    if (!myPick) {
      resultLine.textContent = "You didn't pick — you're safe by default, but sit this one out.";
    } else if (myPick === round.adminPick) {
      resultLine.textContent = "You matched the admin — you're eliminated.";
    } else {
      resultLine.textContent = "You avoided the admin — you're still in!";
    }
    processEliminationOnce(r, myPick, round.adminPick);
  }
}

function makePick(r, opt) {
  roundRef(gameCode, r).child('picks/' + playerId).set(opt);
}

function processEliminationOnce(r, myPick, adminPick) {
  const key = 'r' + r;
  if (processedRounds[key]) return;
  processedRounds[key] = true;
  if (myPick && myPick === adminPick) {
    playersRef(gameCode).child(playerId).child('eliminated').set(true);
  }
}

function showFinal(players) {
  gameCard.style.display = 'none';
  leaderboardCard.style.display = 'block';
  const body = document.getElementById('leaderboardBody');
  const list = Object.values(players || {}).filter(p => !p.isAdmin);
  const survivors = list.filter(p => !p.eliminated);
  const out = list.filter(p => p.eliminated);
  const rows = survivors.map(p => `<tr><td>🏆</td><td>${p.name}</td><td>Survived</td></tr>`)
    .concat(out.map(p => `<tr><td>—</td><td>${p.name}</td><td>Eliminated</td></tr>`));
  body.innerHTML = rows.join('');
}

window.onload = () => {
  const savedCode = localStorage.getItem('gn_game_code');
  if (savedCode) document.getElementById('codeInput').value = savedCode;
};
