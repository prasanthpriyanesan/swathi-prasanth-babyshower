// Application State
let blessingsData = JSON.parse(localStorage.getItem('babyShowerBlessings')) || [
  {
    author: "Grandma Kausalya & Grandpa Sharma",
    relation: "Paternal Grandparents",
    text: "May the divine Mother Goddess shower her eternal grace on our dear daughter Ananya and the little angel inside. Aashirwad!",
    tag: "Family Elder"
  },
  {
    author: "Meera & Rajesh Uncle",
    relation: "Family Friends",
    text: "Wishing you a healthy, peaceful, and joyous Seemantham celebration. We cannot wait to hold the baby in our arms!",
    tag: "Well Wisher"
  },
  {
    author: "Priya & Karthik",
    relation: "Cousins",
    text: "Sending tons of love and glass bangles! May the mother-to-be stay glowing and happy always.",
    tag: "Cousin"
  }
];

let rsvpList = JSON.parse(localStorage.getItem('babyShowerRSVPs')) || [
  { name: "Suresh & Savitri", phone: "+91 98400 12345", count: "2", diet: "Pure Veg", song: "Chanda Hai Tu Mera Suraj Hai Tu" },
  { name: "Anish & Divya", phone: "+1 408 555 0192", count: "2", diet: "Pure Veg", song: "Soja Rajkumari" }
];

let votes = JSON.parse(localStorage.getItem('babyShowerVotes')) || { Girl: 12, Boy: 10 };

// 1. Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  renderBlessings();
  updateVoteBars();
  initMarigoldPetals();
});

// 2. Countdown Timer
function initCountdown() {
  const targetDate = new Date("October 18, 2026 10:30:00").getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      document.getElementById('countdownCard').innerHTML = "<h3 style='color:var(--primary-gold-light);'>The Auspicious Ceremony is Today!</h3>";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = days;
    document.getElementById('hours').innerText = hours < 10 ? '0' + hours : hours;
    document.getElementById('minutes').innerText = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById('seconds').innerText = seconds < 10 ? '0' + seconds : seconds;
  }

  update();
  setInterval(update, 1000);
}

// 3. Falling Marigold Petals Animation
function initMarigoldPetals() {
  const canvas = document.getElementById('petalsCanvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const petalColors = ['#FF8C00', '#FFB300', '#FFD700', '#E65100', '#FFF59D'];
  const numPetals = 35;
  const petals = [];

  for (let i = 0; i < numPetals; i++) {
    petals.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      radius: Math.random() * 5 + 4,
      color: petalColors[Math.floor(Math.random() * petalColors.length)],
      speedY: Math.random() * 1.5 + 0.8,
      speedX: Math.random() * 1 - 0.5,
      angle: Math.random() * 360,
      spin: Math.random() * 0.04 - 0.02
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    petals.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Draw petal shape
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius, p.radius * 1.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.75;
      ctx.fill();
      ctx.restore();

      p.y += p.speedY;
      p.x += Math.sin(p.y * 0.01) * 0.8 + p.speedX;
      p.angle += p.spin;

      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    });

    requestAnimationFrame(draw);
  }

  draw();
}

// 4. Music Player Toggle
let isPlayingMusic = false;
function toggleMusic() {
  const audio = document.getElementById('bgMusic');
  const icon = document.getElementById('musicIcon');
  const text = document.getElementById('musicText');

  if (isPlayingMusic) {
    audio.pause();
    icon.innerText = '🎵';
    text.innerText = 'Play Ambiance';
    isPlayingMusic = false;
  } else {
    audio.play().then(() => {
      icon.innerText = '⏸️';
      text.innerText = 'Pause Flute';
      isPlayingMusic = true;
    }).catch(err => {
      console.log('Audio autoplay blocked:', err);
      alert('Please interact with the page first to allow music playback!');
    });
  }
}

// 5. Aashirwad Blessings Functions
function renderBlessings() {
  const container = document.getElementById('blessingsGrid');
  if (!container) return;

  container.innerHTML = blessingsData.map(item => `
    <div class="blessing-card">
      <p class="blessing-text">"${escapeHtml(item.text)}"</p>
      <div class="blessing-author">
        <span>— ${escapeHtml(item.author)}</span>
        <span class="blessing-tag">${escapeHtml(item.tag || 'Blessing')}</span>
      </div>
    </div>
  `).join('');
}

function handleBlessingSubmit(e) {
  e.preventDefault();
  const author = document.getElementById('blessingAuthor').value.trim();
  const relation = document.getElementById('blessingRelation').value.trim() || 'Well Wisher';
  const text = document.getElementById('blessingText').value.trim();

  if (!author || !text) return;

  const newBlessing = { author, text, tag: relation };
  blessingsData.unshift(newBlessing);
  localStorage.setItem('babyShowerBlessings', JSON.stringify(blessingsData));

  renderBlessings();
  document.getElementById('blessingForm').reset();
  alert('🙏 Thank you! Your auspicious blessing has been posted to the wall.');
}

// 6. Predictions & Polls
function castVote(type) {
  votes[type] = (votes[type] || 0) + 1;
  localStorage.setItem('babyShowerVotes', JSON.stringify(votes));
  updateVoteBars();

  document.getElementById('btnGirl').classList.toggle('selected', type === 'Girl');
  document.getElementById('btnBoy').classList.toggle('selected', type === 'Boy');
}

function updateVoteBars() {
  const total = (votes.Girl || 0) + (votes.Boy || 0);
  if (total === 0) return;

  const girlPct = Math.round((votes.Girl / total) * 100);
  const boyPct = 100 - girlPct;

  document.getElementById('girlPercent').innerText = `${girlPct}%`;
  document.getElementById('girlBar').style.width = `${girlPct}%`;

  document.getElementById('boyPercent').innerText = `${boyPct}%`;
  document.getElementById('boyBar').style.width = `${boyPct}%`;
}

function handlePredictionForm(e) {
  e.preventDefault();
  const likeness = document.getElementById('likenessSelect').value;
  const timing = document.getElementById('timeSelect').value;
  alert(`✨ Thank you for predicting! You guessed ${likeness} born during ${timing}.`);
}

// 7. RSVP Modals & Logic
function openRsvpModal() {
  document.getElementById('rsvpModal').classList.add('active');
}
function closeRsvpModal() {
  document.getElementById('rsvpModal').classList.remove('active');
}

function openShagunModal() {
  document.getElementById('shagunModal').classList.add('active');
}
function closeShagunModal() {
  document.getElementById('shagunModal').classList.remove('active');
}

function handleRsvpSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('rsvpName').value.trim();
  const phone = document.getElementById('rsvpPhone').value.trim();
  const count = document.getElementById('rsvpCount').value;
  const diet = document.getElementById('rsvpDiet').value;
  const song = document.getElementById('rsvpSong').value.trim() || 'No song request';

  const entry = { name, phone, count, diet, song };
  rsvpList.push(entry);
  localStorage.setItem('babyShowerRSVPs', JSON.stringify(rsvpList));

  closeRsvpModal();
  document.getElementById('rsvpForm').reset();
  alert(`🪔 Thank you, ${name}! Your RSVP for ${count} guest(s) has been registered. We look forward to seeing you!`);
}

// 8. Host Admin Modal
function openAdminModal() {
  const tableBody = document.getElementById('adminRsvpTable');
  const totalGuestsSpan = document.getElementById('adminTotalGuests');

  let totalCount = 0;
  tableBody.innerHTML = rsvpList.map(r => {
    totalCount += (parseInt(r.count) || 1);
    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px; font-weight: 600;">${escapeHtml(r.name)}</td>
        <td style="padding: 8px;">${escapeHtml(r.phone)}</td>
        <td style="padding: 8px;">${escapeHtml(r.count)}</td>
        <td style="padding: 8px; color: var(--saffron-orange); font-weight:600;">${escapeHtml(r.diet)}</td>
        <td style="padding: 8px;">${escapeHtml(r.song)}</td>
      </tr>
    `;
  }).join('');

  totalGuestsSpan.innerText = `${totalCount} Attending (${rsvpList.length} Entries)`;
  document.getElementById('adminModal').classList.add('active');
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('active');
}

// Helper: XSS escape
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return map[match];
  });
}
