import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { db } from './lib/supabase';

export default function App() {
  // Audio state
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Modals state
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState('rsvps'); // 'rsvps' or 'blessings'
  const [clickCount, setClickCount] = useState(0);

  // Data state
  const [blessings, setBlessings] = useState([]);
  const [rsvps, setRsvps] = useState([]);

  // Form states (Simplified RSVP: Only Name & Count)
  const [rsvpForm, setRsvpForm] = useState({ name: '', count: '2', phone: 'N/A', diet: 'Pure Veg', song: '' });
  const [blessingForm, setBlessingForm] = useState({ author: '', relation: '', text: '' });

  // Fetch initial data & check for Secret Admin URL
  useEffect(() => {
    loadData();
    initCountdown();
    initPetalsCanvas();

    // Check Secret URL: ?admin=true or ?host=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('host') === 'true') {
      setIsAdminOpen(true);
    }
  }, []);

  const loadData = async () => {
    const loadedBlessings = await db.getBlessings();
    const loadedRsvps = await db.getRsvps();

    setBlessings(loadedBlessings);
    setRsvps(loadedRsvps);
  };

  // Secret Triple-Click Gesture on Footer Symbol
  const handleSecretFooterClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 3) {
      setIsAdminOpen(true);
      setClickCount(0);
    }
  };

  // Countdown
  const initCountdown = () => {
    const targetDate = new Date("August 16, 2026 16:00:00").getTime();
    const update = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  };

  // Falling Petals Canvas
  const initPetalsCanvas = () => {
    const canvas = document.getElementById('petalsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#FF8C00', '#FFB300', '#FFD700', '#E65100', '#FFF59D'];
    const petals = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      radius: Math.random() * 5 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 1.5 + 0.8,
      speedX: Math.random() * 1 - 0.5,
      angle: Math.random() * 360,
      spin: Math.random() * 0.04 - 0.02
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
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
    };

    draw();
  };

  // Audio Handler
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(err => {
        alert("Click anywhere on the page first to allow background audio!");
      });
    }
  };

  // Confetti trigger
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF8C00', '#FFB300', '#D4AF37', '#8B0000']
    });
  };

  // Form Submissions & Deletions
  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!rsvpForm.name) return;

    await db.addRsvp({
      name: rsvpForm.name,
      count: rsvpForm.count,
      phone: 'N/A',
      diet: 'Pure Veg',
      song: ''
    });
    triggerConfetti();
    setIsRsvpOpen(false);
    setRsvpForm({ name: '', count: '2', phone: 'N/A', diet: 'Pure Veg', song: '' });
    await loadData();
    alert(`🪔 Thank you, ${rsvpForm.name}! Your RSVP has been confirmed for Swathi's celebration.`);
  };

  const handleBlessingSubmit = async (e) => {
    e.preventDefault();
    if (!blessingForm.author || !blessingForm.text) return;

    await db.addBlessing({
      author: blessingForm.author,
      relation: blessingForm.relation || 'Well Wisher',
      text: blessingForm.text
    });
    setBlessingForm({ author: '', relation: '', text: '' });
    await loadData();
    triggerConfetti();
    alert("🙏 Thank you! Your blessing has been posted on the wall.");
  };

  const handleDeleteRsvp = async (id) => {
    if (window.confirm("Are you sure you want to delete this RSVP entry?")) {
      await db.deleteRsvp(id);
      await loadData();
    }
  };

  const handleDeleteBlessing = async (id) => {
    if (window.confirm("Are you sure you want to delete this blessing from the wall?")) {
      await db.deleteBlessing(id);
      await loadData();
    }
  };

  // Export CSV for Host
  const exportRsvpsCsv = () => {
    if (rsvps.length === 0) {
      alert("No RSVPs to export yet!");
      return;
    }
    const headers = ["Name", "Total Guests Attending", "Date Submitted"];
    const rows = rsvps.map(r => [
      `"${r.name}"`,
      `"${r.count}"`,
      `"${r.created_at || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Swathi_Seemantham_RSVPs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalGuestsCount = rsvps.reduce((acc, curr) => acc + (parseInt(curr.count) || 1), 0);

  return (
    <div>
      <canvas id="petalsCanvas"></canvas>

      {/* Audio Element */}
      <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=indian-flute-ambient-112318.mp3" />

      {/* Top Shloka Bar (Tamil & Telugu Invocations) */}
      <div className="shloka-bar">
        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}>
          ॥ ஶ்ரீ கணேசாய நமஃ ॥ &nbsp;|&nbsp; ॥ శ్రీ గణేశాయ నమః ॥ &nbsp;|&nbsp; Seemantham/Valaikappu
        </span>
        <button className="music-btn" onClick={toggleMusic}>
          <span>{isPlayingMusic ? '⏸️' : '🎵'}</span>
          <span>{isPlayingMusic ? 'Pause Flute' : 'Play Ambiance'}</span>
        </button>
      </div>

      {/* Header */}
      <header>
        <div className="container nav-content">
          <a href="#" className="logo">
            <div className="logo-icon">🪔</div>
            <div className="logo-text">Seemantham/Valaikappu</div>
          </a>
          <nav>
            <ul className="nav-links">
              <li><a href="#welcome">Welcome</a></li>
              <li><a href="#details">Event Details</a></li>
              <li><a href="#blessings">Ashirwadam</a></li>
              <li><a href="#registry">Registry</a></li>
              <li>
                <button className="btn-rsvp-nav" onClick={() => setIsRsvpOpen(true)}>RSVP Now</button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero-overlay-content">
          <span className="traditional-tag">✨ Auspicious Celebrations ✨</span>
          <h1 className="hero-title font-heading">Celebrating New Life & Motherhood</h1>
          <p className="hero-subtitle">With the Blessings of Elders & Divine Grace, We Warmly Invite You to the Seemantham/Valaikappu of</p>
          
          {/* Swathi in English, Tamil (சுவாதி), and Telugu (స్వాతి) */}
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ fontFamily: "'Rozha One', serif", fontSize: '3.2rem', color: 'var(--turmeric-yellow)', textShadow: '0 2px 10px rgba(0,0,0,0.6)', lineHeight: '1.2' }}>
              Swathi
            </h2>
            <div style={{ fontSize: '1.5rem', color: 'var(--primary-gold-light)', fontWeight: 700, letterSpacing: '2px', textShadow: '0 2px 8px rgba(0,0,0,0.7)', marginTop: '4px' }}>
              சுவாதி &nbsp;•&nbsp; స్వాతి
            </div>
          </div>

          {/* Countdown Card */}
          <div className="hero-date-card">
            <div className="countdown-item">
              <span className="countdown-num">{timeLeft.days}</span>
              <span className="countdown-label">Days</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-num">{timeLeft.hours < 10 ? '0' + timeLeft.hours : timeLeft.hours}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-num">{timeLeft.minutes < 10 ? '0' + timeLeft.minutes : timeLeft.minutes}</span>
              <span className="countdown-label">Mins</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-num">{timeLeft.seconds < 10 ? '0' + timeLeft.seconds : timeLeft.seconds}</span>
              <span className="countdown-label">Secs</span>
            </div>
          </div>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => setIsRsvpOpen(true)}>
              <span>🪔 Confirm Your Presence (RSVP)</span>
            </button>
            <a href="#details" className="btn-secondary" style={{ textDecoration: 'none' }}>View Venue & Timing</a>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="section" id="welcome">
        <div className="container">
          <div className="welcome-grid">
            <div className="welcome-card">
              <div className="section-icon">🌺</div>
              <h3 className="font-heading" style={{ fontSize: '1.8rem', color: 'var(--deep-maroon)', marginBottom: '16px' }}>
                Seemantham/Valaikappu (சீமந்தம்/வளைகாப்பு)
              </h3>
              <p>
                <strong>Seemantham</strong> (తెలుగు) / <strong>Valaikappu</strong> (தமிழ்) is a time-honored traditional celebration showering the mother-to-be, <strong>Swathi (சுவாதி / స్వాతి)</strong>, with love, glass bangles, turmeric, kumkum, and elder blessings.
              </p>
              <p>
                We warmly welcome our beloved family and friends to join us in bestowing Ashirwadam, chanting sacred prayers, and celebrating this joyful milestone together.
              </p>
              <div style={{ marginTop: '20px', fontWeight: 700, color: 'var(--saffron-orange)', fontSize: '1.1rem' }}>
                🗓️ Sunday, August 16, 2026 &nbsp;|&nbsp; 🕒 Starts at 4:00 PM
              </div>
            </div>

            <div className="welcome-image-wrapper">
              <img src="/assets/traditional_kalash.png" alt="Traditional Kalash and Bangles Motif" />
            </div>
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="section rituals-bg" id="details">
        <div className="container">
          <div className="section-header">
            <div className="section-icon">📍</div>
            <h2 className="section-title font-heading">Event Details & Venue</h2>
            <p className="section-sub font-subheading">Date, Time & Location Information</p>
            <div className="divider-ornament">
              <div className="divider-line"></div>
              <span>🌸</span>
              <div className="divider-line"></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '30px' }}>
            <div className="ritual-card" style={{ padding: '35px 24px' }}>
              <span className="ritual-time">🗓️ Date</span>
              <h3 className="font-subheading" style={{ color: 'var(--deep-maroon)', fontSize: '1.4rem', margin: '10px 0' }}>Sunday, August 16, 2026</h3>
              <p style={{ color: 'var(--text-muted)' }}>Mark your calendars!</p>
            </div>

            <div className="ritual-card" style={{ padding: '35px 24px' }}>
              <span className="ritual-time">🕒 Event Timings</span>
              <h3 className="font-subheading" style={{ color: 'var(--deep-maroon)', fontSize: '1.4rem', margin: '10px 0' }}>Starts at 4:00 PM</h3>
              <p style={{ color: 'var(--text-muted)' }}>Refreshments followed by Dinner</p>
            </div>
          </div>

          {/* Venue Card */}
          <div className="venue-card">
            <div>
              <h3 style={{ fontSize: '1.8rem', color: 'var(--primary-gold-light)', marginBottom: '8px' }}>📍 Event Venue</h3>
              <p style={{ fontSize: '1.15rem', fontWeight: 600, color: '#fff' }}>1737 Sawmill Xing</p>
              <p style={{ fontSize: '1.05rem', opacity: 0.95, color: 'var(--primary-gold-light)' }}>Round Rock, Texas 78665</p>
            </div>
            <div>
              <a href="https://www.google.com/maps/search/?api=1&query=1737+Sawmill+Xing,+Round+Rock,+Texas+78665" target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>
                <span>🗺️ Open in Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Ashirwadam Blessings Board */}
      <section className="section" id="blessings">
        <div className="container">
          <div className="section-header">
            <div className="section-icon">🙏</div>
            <h2 className="section-title font-heading">Ashirwadam & Wishes Board</h2>
            <p className="section-sub">Shower Swathi & Prasanth with Your Heartfelt Blessings</p>
          </div>

          <div className="wishes-form-card">
            <form onSubmit={handleBlessingSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>Your Name / Family Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sundar & Meena Family"
                    value={blessingForm.author}
                    onChange={e => setBlessingForm({ ...blessingForm, author: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Relationship / Note</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Grandparents / Well Wishers"
                    value={blessingForm.relation}
                    onChange={e => setBlessingForm({ ...blessingForm, relation: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Your Blessing / Message *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="May divine grace shower health, happiness, and peace..."
                  value={blessingForm.text}
                  onChange={e => setBlessingForm({ ...blessingForm, text: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                <span>✨ Post Blessing to Wall</span>
              </button>
            </form>
          </div>

          {/* Blessings Display */}
          {blessings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', border: '2px dashed var(--card-border)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🌸</div>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Be the first to leave an Ashirwadam blessing for Swathi & Prasanth!
              </p>
            </div>
          ) : (
            <div className="blessings-grid">
              {blessings.map((b, i) => (
                <div key={b.id || i} className="blessing-card">
                  <p style={{ fontStyle: 'italic', marginBottom: '14px', fontSize: '1.05rem' }}>"{b.text}"</p>
                  <div style={{ fontWeight: 700, color: 'var(--deep-maroon)', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>— {b.author}</span>
                    <span style={{ fontSize: '0.8rem', background: 'var(--silk-warm)', color: 'var(--saffron-orange)', padding: '2px 8px', borderRadius: '12px' }}>
                      {b.relation || b.tag || 'Blessing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Registry Section */}
      <section className="section rituals-bg" id="registry">
        <div className="container">
          <div className="section-header">
            <div className="section-icon">🎁</div>
            <h2 className="section-title font-heading">Baby Registry</h2>
            <p className="section-sub">Your presence and blessings are our greatest gift!</p>
          </div>

          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ background: '#fff', padding: '35px 24px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>🎁</div>
              <h3 className="font-subheading" style={{ color: 'var(--deep-maroon)', marginBottom: '8px' }}>Baby Registry</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '16px' }}>
                Baby registry details will be updated soon. Stay tuned!
              </p>
              <button className="btn-secondary" style={{ background: 'var(--silk-warm)', color: 'var(--text-dark)', border: '1px solid var(--card-border)', cursor: 'default' }}>
                Registry Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p
            className="font-subheading"
            onClick={handleSecretFooterClick}
            style={{ fontSize: '1.15rem', marginBottom: '10px', color: 'var(--primary-gold-light)', cursor: 'pointer', userSelect: 'none' }}
            title="Blessings"
          >
            ॥ సర్వేజనా సుఖినోభవంతు ॥ &nbsp;|&nbsp; ॥ வாழ்க வளமுடன் ॥
          </p>
          <p>May all beings be blessed with peace and health. With love, Swathi & Prasanth Family.</p>
        </div>
      </footer>

      {/* Simplified Minimal RSVP Modal (Only Name & Total Attending) */}
      {isRsvpOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsRsvpOpen(false)}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.5rem' }}>🪔</div>
              <h2 className="font-heading" style={{ color: 'var(--deep-maroon)', fontSize: '2rem' }}>Confirm Your Presence</h2>
              <p style={{ color: 'var(--text-muted)' }}>Please RSVP by August 5, 2026</p>
            </div>

            <form onSubmit={handleRsvpSubmit}>
              <div className="form-group">
                <label>Full Name / Family Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sundar & Meena Family"
                  value={rsvpForm.name}
                  onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Guests Attending *</label>
                <select
                  className="form-control"
                  value={rsvpForm.count}
                  onChange={e => setRsvpForm({ ...rsvpForm, count: e.target.value })}
                >
                  <option value="1">1 Person</option>
                  <option value="2">2 Persons</option>
                  <option value="3">3 Persons</option>
                  <option value="4">4 Persons</option>
                  <option value="5">5 Persons</option>
                  <option value="6+">6+ Persons</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '15px' }}>
                <span>🙏 Confirm RSVP</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Secret Host Admin Control Panel */}
      {isAdminOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <button className="modal-close" onClick={() => setIsAdminOpen(false)}>✕</button>
            <h2 className="font-heading" style={{ color: 'var(--deep-maroon)', marginBottom: '16px' }}>
              🔐 Host Secret Control Panel
            </h2>

            {/* Admin Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--silk-warm)', pb: '10px' }}>
              <button
                onClick={() => setAdminTab('rsvps')}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: adminTab === 'rsvps' ? 'var(--saffron-orange)' : 'var(--silk-warm)',
                  color: adminTab === 'rsvps' ? '#fff' : 'var(--text-dark)'
                }}
              >
                📋 Manage RSVPs ({rsvps.length})
              </button>
              <button
                onClick={() => setAdminTab('blessings')}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: adminTab === 'blessings' ? 'var(--saffron-orange)' : 'var(--silk-warm)',
                  color: adminTab === 'blessings' ? '#fff' : 'var(--text-dark)'
                }}
              >
                🙏 Manage Blessings Wall ({blessings.length})
              </button>
            </div>

            {/* RSVPs Tab */}
            {adminTab === 'rsvps' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--silk-warm)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                  <div>
                    <strong>Total Guests Attending: </strong>
                    <span style={{ color: 'var(--saffron-orange)', fontSize: '1.2rem', fontWeight: 700 }}>{totalGuestsCount}</span>
                  </div>
                  <button onClick={exportRsvpsCsv} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                    📥 Export RSVPs (CSV)
                  </button>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--deep-maroon)', color: 'var(--primary-gold-light)' }}>
                        <th style={{ padding: '8px' }}>Guest / Family Name</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Attending Count</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rsvps.map((r, idx) => (
                        <tr key={r.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{r.name}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: 'var(--saffron-orange)' }}>{r.count}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteRsvp(r.id)}
                              style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Blessings Management Tab */}
            {adminTab === 'blessings' && (
              <div>
                <div style={{ background: 'var(--silk-warm)', padding: '14px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.95rem' }}>
                  Click 🗑️ next to any blessing to delete it from the website and Supabase database.
                </div>

                {blessings.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No blessings posted yet.</p>
                ) : (
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--deep-maroon)', color: 'var(--primary-gold-light)' }}>
                          <th style={{ padding: '8px' }}>Author</th>
                          <th style={{ padding: '8px' }}>Relationship</th>
                          <th style={{ padding: '8px' }}>Blessing Text</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blessings.map((b, idx) => (
                          <tr key={b.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{b.author}</td>
                            <td style={{ padding: '8px', color: 'var(--saffron-orange)' }}>{b.relation || b.tag || 'Well Wisher'}</td>
                            <td style={{ padding: '8px', fontStyle: 'italic' }}>"{b.text}"</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteBlessing(b.id)}
                                style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
