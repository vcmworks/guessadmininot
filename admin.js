// Change this before hosting. This is a convenience gate, not real security.
const ADMIN_PASSCODE = "12243672";

const adminPlayerId = getOrCreateAdminPlayerId();
let gameCode = null;
let round = 1;
let selectedAdminPick = null;

const loginCard = document.getElementById('loginCard');
const setupCard = document.getElementById('setupCard');
const controlCard = document.getElementById('controlCard');
const codeDisplay = document.getElementById('codeDisplay');
const playerCount = document.getElementById('playerCount');
const startGameBtn = document.getElementById('startGameBtn');

document.getElementById('loginBtn').onclick = () => {
  if (document.getElementById('passInput').value === ADMIN_PASSCODE) {
    loginCard.style.display = 'none';
    setupCard.style.display = 'block';
  } else {
    document.getElementById('loginError').textContent = 'Wrong passcode.';
  }
};

document.getElementById('createBtn').onclick = async () => {
  gameCode = genGameCode();
  await gameRef(gameCode).set({ status: 'lobby', players: {}, currentRound: 0, createdAt: Date.now() });

  // Admin auto-joins as a player under the fixed display name.
  await playersRef(gameCode).child(adminPlayerId).set({
    name: ADMIN_DISPLAY_NAME,
    eliminated: false,
    isAdmin: true,
    joinedAt: Date.now()
  });

  codeDisplay.textContent = gameCode;
  codeDisplay.style.display = 'block';
  document.getElementById('createBtn').style.display = 'none';
  startGameBtn.style.display = 'block';

  playersRef(gameCode).on('value', (snap) => {
    const players = snap.val() || {};
    const others = Object.values(players).filter(p => !p.isAdmin).length;
    playerCount.textContent = `${others} player(s) joined (plus you as ${ADMIN_DISPLAY_NAME})`;
    renderStandings(players);
  });
};

startGameBtn.onclick = async () => {
  round = 1;
  await gameRef(gameCode).update({ status: 'in_progress', currentRound: round });
  setupCard.style.display = 'none';
  controlCard.style.display = 'block';
  showSetupRoundBlock();
};

function showSetupRoundBlock() {
  document.getElementById('roundBadge').textContent = `Round ${round} of ${TOTAL_ROUNDS} — ${themeForRound(round)}`;
  document.getElementById('setupRoundBlock').style.display = 'block';
  document.getElementById('liveRoundBlock').style.display = 'none';
  document.getElementById('afterRevealBlock').style.display = 'none';
  selectedAdminPick = null;
  document.getElementById('adminPickStatus').textContent = '';
  document.getElementById('launchRoundBtn').disabled = true;

  const opts = defaultOptionsForRound(round);
  document.getElementById('optionsInput').value = opts.join(', ');
  renderAdminPickGrid(opts);

  document.getElementById('optionsInput').oninput = (e) => {
    const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    selectedAdminPick = null;
    document.getElementById('launchRoundBtn').disabled = true;
    document.getElementById('adminPickStatus').textContent = '';
    renderAdminPickGrid(list);
  };
}

function renderAdminPickGrid(opts) {
  const grid = document.getElementById('adminPickGrid');
  grid.innerHTML = '';
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.type = 'button';
    if (opt === selectedAdminPick) btn.classList.add('mine');
    btn.onclick = () => {
      selectedAdminPick = opt;
      document.getElementById('adminPickStatus').textContent = `Your hidden pick: ${opt}`;
      document.getElementById('launchRoundBtn').disabled = false;
      renderAdminPickGrid(opts);
    };
    grid.appendChild(btn);
  });
}

document.getElementById('launchRoundBtn').onclick = async () => {
  const opts = document.getElementById('optionsInput').value.split(',').map(s => s.trim()).filter(Boolean);
  if (opts.length < 2) { alert('Add at least 2 options.'); return; }
  if (!selectedAdminPick || !opts.includes(selectedAdminPick)) { alert('Tap your hidden pick first.'); return; }

  await roundRef(gameCode, round).set({
    theme: themeForRound(round),
    options: opts,
    adminPick: selectedAdminPick,
    revealed: false,
    picks: {}
  });

  document.getElementById('setupRoundBlock').style.display = 'none';
  document.getElementById('liveRoundBlock').style.display = 'block';
  document.getElementById('hiddenPickLabel').textContent = selectedAdminPick;

  roundRef(gameCode, round).child('picks').on('value', (snap) => {
    renderClaims(snap.val() || {});
  });
};

function renderClaims(picks) {
  playersRef(gameCode).get().then(snap => {
    const players = snap.val() || {};
    const body = document.getElementById('claimsBody');
    const rows = Object.entries(players)
      .filter(([pid, p]) => !p.isAdmin)
      .map(([pid, p]) => {
        const picked = picks[pid] ? 'Yes' : (p.eliminated ? 'Eliminated (spectating)' : 'Not yet');
        return `<tr><td>${p.name}</td><td>${picked}</td></tr>`;
      });
    body.innerHTML = rows.join('');
  });
}

document.getElementById('revealBtn').onclick = async () => {
  await roundRef(gameCode, round).update({ revealed: true });
  const roundSnap = await roundRef(gameCode, round).get();
  const roundData = roundSnap.val();
  const playersSnap = await playersRef(gameCode).get();
  const players = playersSnap.val() || {};
  const picks = roundData.picks || {};

  document.getElementById('revealedLine').textContent = `You picked ${roundData.adminPick}. Anyone who matched is now eliminated.`;

  const rows = [];
  for (const [pid, p] of Object.entries(players)) {
    if (p.isAdmin) continue;
    const pick = picks[pid];
    let result;
    if (p.eliminated && pick !== roundData.adminPick) {
      result = 'Already eliminated (earlier round)';
    } else if (!pick) {
      result = 'No pick — safe';
    } else if (pick === roundData.adminPick) {
      result = 'Matched — ELIMINATED';
      await playersRef(gameCode).child(pid).child('eliminated').set(true);
    } else {
      result = 'Survived';
    }
    rows.push(`<tr><td>${p.name}</td><td>${result}</td></tr>`);
  }
  document.getElementById('resultsBody').innerHTML = rows.join('');

  document.getElementById('liveRoundBlock').style.display = 'none';
  document.getElementById('afterRevealBlock').style.display = 'block';
};

document.getElementById('nextRoundBtn').onclick = async () => {
  if (round >= TOTAL_ROUNDS) {
    finishGame();
    return;
  }
  round += 1;
  await gameRef(gameCode).update({ currentRound: round });
  showSetupRoundBlock();
};

document.getElementById('finishBtn').onclick = finishGame;

async function finishGame() {
  await gameRef(gameCode).update({ status: 'finished' });
}

function renderStandings(players) {
  const body = document.getElementById('standingsBody');
  const arr = Object.values(players);
  arr.sort((a, b) => (a.isAdmin ? -1 : b.isAdmin ? 1 : 0));
  body.innerHTML = arr.map(p => {
    const status = p.isAdmin ? 'Host' : (p.eliminated ? 'Eliminated' : 'Still in');
    return `<tr><td>${p.name}</td><td>${status}</td></tr>`;
  }).join('');
}
