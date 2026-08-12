// Round schedule, in play order. Options shrink from 11 down to 2 as rounds progress —
// the pool gets smaller (and collisions with the admin's pick more likely) the further you go.
const TOTAL_ROUNDS = 10;

const ROUND_SCHEDULE = [
  { theme: "Famous Indian Cricketers", options: ["Sachin Tendulkar","Virat Kohli","MS Dhoni","Rohit Sharma","Sourav Ganguly","Rahul Dravid","Kapil Dev","Yuvraj Singh","Anil Kumble","Ravindra Jadeja","Hardik Pandya"] },
  { theme: "Planets", options: ["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","Ceres"] },
  { theme: "Famous Countries", options: ["India","USA","China","Japan","Brazil","Germany","France","Australia","UK"] },
  { theme: "Continents", options: ["Asia","Africa","North America","South America","Antarctica","Europe","Australia","Oceania"] },
  { theme: "Famous Telugu Heroes", options: ["Chiranjeevi","Nagarjuna","Pawan Kalyan","Mahesh Babu","Prabhas","Allu Arjun","Ram Charan"] },
  { theme: "Oceans", options: ["Pacific","Atlantic","Indian","Southern","Arctic","Mediterranean"] },
  { theme: "Directions", options: ["North","South","East","West","Center"] },
  { theme: "States of Matter", options: ["Solid","Liquid","Gas","Plasma"] },
  { theme: "Head or Tail", options: ["Heads","Tails","Edge"] },
  { theme: "Final Round", options: ["Odd","Even"] }
];

function scheduleForRound(roundNum) {
  return ROUND_SCHEDULE[roundNum - 1]; // roundNum is 1-indexed
}
function optionCountForRound(roundNum) { return scheduleForRound(roundNum).options.length; }
function themeForRound(roundNum) { return scheduleForRound(roundNum).theme; }
function defaultOptionsForRound(roundNum) { return scheduleForRound(roundNum).options.slice(); }

function gameRef(code) { return db.ref('games/' + code); }
function roundRef(code, r) { return gameRef(code).child('rounds/' + r); }
function playersRef(code) { return gameRef(code).child('players'); }

function getOrCreatePlayerId() {
  let id = localStorage.getItem('gn_player_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('gn_player_id', id);
  }
  return id;
}

function getOrCreateAdminPlayerId() {
  let id = localStorage.getItem('gn_admin_player_id');
  if (!id) {
    id = 'admin_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('gn_admin_player_id', id);
  }
  return id;
}

const ADMIN_DISPLAY_NAME = "happy56";

function genGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
