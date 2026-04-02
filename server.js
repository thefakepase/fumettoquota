const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── DATA LAYER ───────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(COLLECTIONS_FILE)) fs.writeFileSync(COLLECTIONS_FILE, '{}');
if (!fs.existsSync(WAITLIST_FILE)) fs.writeFileSync(WAITLIST_FILE, '[]');

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return file === USERS_FILE || file === WAITLIST_FILE ? [] : {}; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── DATABASE FUMETTI ─────────────────────────────────────────
const comicsDB = [
  // DYLAN DOG (Sergio Bonelli Editore)
  { id: 1, series: "Dylan Dog", number: 1, title: "L'alba dei morti viventi", publisher: "Sergio Bonelli Editore", year: 1986, baseValue: 180, category: "Fumetti Italiani" },
  { id: 2, series: "Dylan Dog", number: 2, title: "Mattanza", publisher: "Sergio Bonelli Editore", year: 1986, baseValue: 40, category: "Fumetti Italiani" },
  { id: 3, series: "Dylan Dog", number: 3, title: "Il fantasma di Anna Never", publisher: "Sergio Bonelli Editore", year: 1987, baseValue: 30, category: "Fumetti Italiani" },
  { id: 4, series: "Dylan Dog", number: 4, title: "Il ritorno del mostro", publisher: "Sergio Bonelli Editore", year: 1987, baseValue: 22, category: "Fumetti Italiani" },
  { id: 5, series: "Dylan Dog", number: 5, title: "Il passa-mani", publisher: "Sergio Bonelli Editore", year: 1987, baseValue: 20, category: "Fumetti Italiani" },
  { id: 6, series: "Dylan Dog", number: 100, title: "Golconda!", publisher: "Sergio Bonelli Editore", year: 1995, baseValue: 25, category: "Fumetti Italiani" },
  { id: 7, series: "Dylan Dog", number: 200, title: "Memorie dall'invisibile", publisher: "Sergio Bonelli Editore", year: 2003, baseValue: 15, category: "Fumetti Italiani" },
  { id: 8, series: "Dylan Dog", number: 300, title: "Io sono Dylan Dog", publisher: "Sergio Bonelli Editore", year: 2011, baseValue: 18, category: "Fumetti Italiani" },
  // TEX (Sergio Bonelli Editore)
  { id: 10, series: "Tex", number: 1, title: "La mano rossa", publisher: "Sergio Bonelli Editore", year: 1958, baseValue: 1200, category: "Fumetti Italiani" },
  { id: 11, series: "Tex", number: 2, title: "Il totem misterioso", publisher: "Sergio Bonelli Editore", year: 1958, baseValue: 350, category: "Fumetti Italiani" },
  { id: 12, series: "Tex", number: 3, title: "Sulla pista degli Apaches", publisher: "Sergio Bonelli Editore", year: 1959, baseValue: 200, category: "Fumetti Italiani" },
  { id: 13, series: "Tex", number: 10, title: "Il sentiero di guerra", publisher: "Sergio Bonelli Editore", year: 1960, baseValue: 90, category: "Fumetti Italiani" },
  { id: 14, series: "Tex", number: 100, title: "Caccia all'uomo", publisher: "Sergio Bonelli Editore", year: 1968, baseValue: 40, category: "Fumetti Italiani" },
  // ZAGOR (Sergio Bonelli Editore)
  { id: 20, series: "Zagor", number: 1, title: "Il segno di Zagor", publisher: "Sergio Bonelli Editore", year: 1961, baseValue: 800, category: "Fumetti Italiani" },
  { id: 21, series: "Zagor", number: 2, title: "Il totem maledetto", publisher: "Sergio Bonelli Editore", year: 1961, baseValue: 250, category: "Fumetti Italiani" },
  { id: 22, series: "Zagor", number: 100, title: "La valle del terrore", publisher: "Sergio Bonelli Editore", year: 1972, baseValue: 30, category: "Fumetti Italiani" },
  // MARTIN MYSTÈRE (Sergio Bonelli Editore)
  { id: 30, series: "Martin Mystère", number: 1, title: "L'uomo impossibile", publisher: "Sergio Bonelli Editore", year: 1982, baseValue: 120, category: "Fumetti Italiani" },
  { id: 31, series: "Martin Mystère", number: 2, title: "Il mistero di Stonehenge", publisher: "Sergio Bonelli Editore", year: 1982, baseValue: 45, category: "Fumetti Italiani" },
  // DIABOLIK (Astorina)
  { id: 40, series: "Diabolik", number: 1, title: "Il re del terrore", publisher: "Astorina", year: 1962, baseValue: 8000, category: "Fumetti Italiani" },
  { id: 41, series: "Diabolik", number: 2, title: "L'arresto di Diabolik", publisher: "Astorina", year: 1962, baseValue: 1500, category: "Fumetti Italiani" },
  { id: 42, series: "Diabolik", number: 3, title: "Tre croci per Diabolik", publisher: "Astorina", year: 1963, baseValue: 600, category: "Fumetti Italiani" },
  { id: 43, series: "Diabolik", number: 10, title: "Il castello della paura", publisher: "Astorina", year: 1964, baseValue: 180, category: "Fumetti Italiani" },
  // TOPOLINO (Mondadori/Panini)
  { id: 50, series: "Topolino", number: 1, title: "Topolino n. 1", publisher: "Mondadori", year: 1949, baseValue: 5000, category: "Fumetti Italiani" },
  { id: 51, series: "Topolino", number: 100, title: "Topolino n. 100", publisher: "Mondadori", year: 1952, baseValue: 180, category: "Fumetti Italiani" },
  { id: 52, series: "Topolino", number: 1000, title: "Topolino n. 1000", publisher: "Mondadori", year: 1974, baseValue: 35, category: "Fumetti Italiani" },
  { id: 53, series: "Topolino", number: 2000, title: "Topolino n. 2000", publisher: "Mondadori", year: 1994, baseValue: 15, category: "Fumetti Italiani" },
  // CORTO MALTESE (Hugo Pratt)
  { id: 60, series: "Corto Maltese", number: 1, title: "La ballata del mare salato", publisher: "Rizzoli Lizard", year: 1967, baseValue: 300, category: "Fumetti d'Autore" },
  { id: 61, series: "Corto Maltese", number: 2, title: "Corto Maltese in Siberia", publisher: "Rizzoli Lizard", year: 1975, baseValue: 120, category: "Fumetti d'Autore" },
  // NATHAN NEVER (Sergio Bonelli Editore)
  { id: 70, series: "Nathan Never", number: 1, title: "Destino", publisher: "Sergio Bonelli Editore", year: 1991, baseValue: 45, category: "Fumetti Italiani" },
  { id: 71, series: "Nathan Never", number: 2, title: "Metallo mortale", publisher: "Sergio Bonelli Editore", year: 1991, baseValue: 20, category: "Fumetti Italiani" },
  // MISTER NO (Sergio Bonelli Editore)
  { id: 80, series: "Mister No", number: 1, title: "Amazzonia", publisher: "Sergio Bonelli Editore", year: 1975, baseValue: 180, category: "Fumetti Italiani" },
  { id: 81, series: "Mister No", number: 2, title: "I predatori della giungla", publisher: "Sergio Bonelli Editore", year: 1975, baseValue: 70, category: "Fumetti Italiani" },
  // JULIA (Sergio Bonelli Editore)
  { id: 90, series: "Julia", number: 1, title: "I killer venivano dal Passato", publisher: "Sergio Bonelli Editore", year: 1998, baseValue: 35, category: "Fumetti Italiani" },
  // MANGA - DRAGON BALL (Star Comics)
  { id: 100, series: "Dragon Ball", number: 1, title: "Dragon Ball vol. 1", publisher: "Star Comics", year: 1995, baseValue: 85, category: "Manga" },
  { id: 101, series: "Dragon Ball", number: 2, title: "Dragon Ball vol. 2", publisher: "Star Comics", year: 1995, baseValue: 40, category: "Manga" },
  { id: 102, series: "Dragon Ball", number: 3, title: "Dragon Ball vol. 3", publisher: "Star Comics", year: 1995, baseValue: 30, category: "Manga" },
  { id: 103, series: "Dragon Ball", number: 42, title: "Dragon Ball vol. 42", publisher: "Star Comics", year: 2002, baseValue: 25, category: "Manga" },
  // MANGA - NARUTO (Panini Comics)
  { id: 110, series: "Naruto", number: 1, title: "Naruto vol. 1", publisher: "Panini Comics", year: 2000, baseValue: 40, category: "Manga" },
  { id: 111, series: "Naruto", number: 2, title: "Naruto vol. 2", publisher: "Panini Comics", year: 2000, baseValue: 18, category: "Manga" },
  { id: 112, series: "Naruto", number: 72, title: "Naruto vol. 72", publisher: "Panini Comics", year: 2014, baseValue: 20, category: "Manga" },
  // MANGA - ONE PIECE (Star Comics)
  { id: 120, series: "One Piece", number: 1, title: "One Piece vol. 1", publisher: "Star Comics", year: 2001, baseValue: 60, category: "Manga" },
  { id: 121, series: "One Piece", number: 2, title: "One Piece vol. 2", publisher: "Star Comics", year: 2001, baseValue: 22, category: "Manga" },
  { id: 122, series: "One Piece", number: 100, title: "One Piece vol. 100", publisher: "Star Comics", year: 2021, baseValue: 25, category: "Manga" },
  // MANGA - DEATH NOTE (Panini Comics)
  { id: 130, series: "Death Note", number: 1, title: "Death Note vol. 1", publisher: "Panini Comics", year: 2004, baseValue: 35, category: "Manga" },
  { id: 131, series: "Death Note", number: 2, title: "Death Note vol. 2", publisher: "Panini Comics", year: 2004, baseValue: 18, category: "Manga" },
  // MANGA - BERSERK (Panini Comics)
  { id: 140, series: "Berserk", number: 1, title: "Berserk vol. 1", publisher: "Panini Comics", year: 1997, baseValue: 120, category: "Manga" },
  { id: 141, series: "Berserk", number: 2, title: "Berserk vol. 2", publisher: "Panini Comics", year: 1997, baseValue: 55, category: "Manga" },
  { id: 142, series: "Berserk", number: 40, title: "Berserk vol. 40", publisher: "Panini Comics", year: 2018, baseValue: 20, category: "Manga" },
  // MANGA - ATTACK ON TITAN (Panini Comics)
  { id: 150, series: "L'Attacco dei Giganti", number: 1, title: "L'Attacco dei Giganti vol. 1", publisher: "Panini Comics", year: 2012, baseValue: 30, category: "Manga" },
  { id: 151, series: "L'Attacco dei Giganti", number: 34, title: "L'Attacco dei Giganti vol. 34", publisher: "Panini Comics", year: 2021, baseValue: 20, category: "Manga" },
  // MANGA - BLEACH (Star Comics)
  { id: 160, series: "Bleach", number: 1, title: "Bleach vol. 1", publisher: "Star Comics", year: 2004, baseValue: 25, category: "Manga" },
  { id: 161, series: "Bleach", number: 74, title: "Bleach vol. 74", publisher: "Star Comics", year: 2016, baseValue: 18, category: "Manga" },
  // MANGA - FULLMETAL ALCHEMIST (Star Comics)
  { id: 170, series: "Fullmetal Alchemist", number: 1, title: "Fullmetal Alchemist vol. 1", publisher: "Star Comics", year: 2004, baseValue: 30, category: "Manga" },
  { id: 171, series: "Fullmetal Alchemist", number: 27, title: "Fullmetal Alchemist vol. 27", publisher: "Star Comics", year: 2011, baseValue: 22, category: "Manga" },
  // MANGA - DEMON SLAYER (Star Comics)
  { id: 180, series: "Demon Slayer", number: 1, title: "Demon Slayer vol. 1", publisher: "Star Comics", year: 2019, baseValue: 15, category: "Manga" },
  { id: 181, series: "Demon Slayer", number: 23, title: "Demon Slayer vol. 23", publisher: "Star Comics", year: 2020, baseValue: 12, category: "Manga" },
  // MANGA - MY HERO ACADEMIA (Star Comics)
  { id: 190, series: "My Hero Academia", number: 1, title: "My Hero Academia vol. 1", publisher: "Star Comics", year: 2016, baseValue: 20, category: "Manga" },
  // MANGA - TOKYO GHOUL (Panini Comics)
  { id: 200, series: "Tokyo Ghoul", number: 1, title: "Tokyo Ghoul vol. 1", publisher: "Panini Comics", year: 2014, baseValue: 22, category: "Manga" },
  // MARVEL ITALIA
  { id: 210, series: "L'Uomo Ragno", number: 1, title: "L'Uomo Ragno n. 1", publisher: "Editoriale Corno", year: 1970, baseValue: 600, category: "Marvel/DC" },
  { id: 211, series: "Spider-Man", number: 1, title: "Spider-Man n. 1", publisher: "Marvel Italia", year: 1994, baseValue: 25, category: "Marvel/DC" },
  { id: 212, series: "Gli Incredibili X-Men", number: 1, title: "Gli Incredibili X-Men n. 1", publisher: "Editoriale Corno", year: 1974, baseValue: 150, category: "Marvel/DC" },
  { id: 213, series: "I Fantastici Quattro", number: 1, title: "I Fantastici Quattro n. 1", publisher: "Editoriale Corno", year: 1971, baseValue: 350, category: "Marvel/DC" },
  { id: 214, series: "Capitan America", number: 1, title: "Capitan America n. 1", publisher: "Editoriale Corno", year: 1973, baseValue: 120, category: "Marvel/DC" },
  // DC ITALIA
  { id: 220, series: "Batman", number: 1, title: "Batman n. 1", publisher: "Cenisio", year: 1966, baseValue: 400, category: "Marvel/DC" },
  { id: 221, series: "Superman", number: 1, title: "Superman n. 1", publisher: "Cenisio", year: 1964, baseValue: 350, category: "Marvel/DC" },
  // MANGA - JOJO'S BIZARRE ADVENTURE (Star Comics)
  { id: 230, series: "JoJo's Bizarre Adventure", number: 1, title: "JoJo's Bizarre Adventure vol. 1", publisher: "Star Comics", year: 2009, baseValue: 45, category: "Manga" },
  // MANGA - DRAGON BALL SUPER (Star Comics)
  { id: 240, series: "Dragon Ball Super", number: 1, title: "Dragon Ball Super vol. 1", publisher: "Star Comics", year: 2017, baseValue: 12, category: "Manga" },
  // TEX WILLER (nuova serie)
  { id: 250, series: "Tex Willer", number: 1, title: "Tex Willer n. 1 - La prima avventura", publisher: "Sergio Bonelli Editore", year: 2018, baseValue: 35, category: "Fumetti Italiani" },
  // FUMETTO MAGAZINE
  { id: 260, series: "Lanciostory", number: 1, title: "Lanciostory n. 1", publisher: "Eura Editoriale", year: 1975, baseValue: 80, category: "Fumetti Italiani" },
  { id: 261, series: "Skorpio", number: 1, title: "Skorpio n. 1", publisher: "Eura Editoriale", year: 1977, baseValue: 60, category: "Fumetti Italiani" },
  // MANGA - HUNTER X HUNTER (Panini Comics)
  { id: 270, series: "Hunter x Hunter", number: 1, title: "Hunter x Hunter vol. 1", publisher: "Panini Comics", year: 2003, baseValue: 35, category: "Manga" },
  // MANGA - FAIRY TAIL (Star Comics)
  { id: 280, series: "Fairy Tail", number: 1, title: "Fairy Tail vol. 1", publisher: "Star Comics", year: 2009, baseValue: 18, category: "Manga" },
  // MANGA - SAO (Panini Comics)
  { id: 290, series: "Sword Art Online", number: 1, title: "Sword Art Online vol. 1", publisher: "Panini Comics", year: 2014, baseValue: 15, category: "Manga" },
];

// ─── CONDITION MULTIPLIERS ────────────────────────────────────
const conditionMultipliers = {
  'mint': 1.0,
  'near-mint': 0.75,
  'very-good': 0.50,
  'good': 0.30,
  'fair': 0.15,
  'poor': 0.05
};

const conditionLabels = {
  'mint': 'Perfetto (Mint)',
  'near-mint': 'Quasi Perfetto (Near Mint)',
  'very-good': 'Molto Buono (Very Good)',
  'good': 'Buono (Good)',
  'fair': 'Discreto (Fair)',
  'poor': 'Usurato (Poor)'
};

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fumettoquota-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Non autorizzato. Accedi per continuare.' });
}

// ─── STATS (per admin) ────────────────────────────────────────
app.get('/api/admin/stats', (req, res) => {
  const users = readJSON(USERS_FILE);
  const collections = readJSON(COLLECTIONS_FILE);
  const waitlist = readJSON(WAITLIST_FILE);
  const totalItems = Object.values(collections).reduce((sum, c) => sum + c.length, 0);
  res.json({ users: users.length, waitlist: waitlist.length, totalCollectionItems: totalItems, comicsInDB: comicsDB.length });
});

// ─── COMICS SEARCH ────────────────────────────────────────────
app.get('/api/comics/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  const number = req.query.n ? parseInt(req.query.n) : null;
  if (!query || query.length < 2) return res.json([]);

  let results = comicsDB.filter(c =>
    c.series.toLowerCase().includes(query) ||
    c.title.toLowerCase().includes(query) ||
    c.publisher.toLowerCase().includes(query)
  );
  if (number !== null) {
    const exact = results.filter(c => c.number === number);
    if (exact.length > 0) results = exact;
  }
  res.json(results.slice(0, 15));
});

// ─── COMIC VALUATION ──────────────────────────────────────────
app.get('/api/comics/:id/value', (req, res) => {
  const comic = comicsDB.find(c => c.id === parseInt(req.params.id));
  if (!comic) return res.status(404).json({ error: 'Fumetto non trovato' });
  const condition = req.query.condition || 'good';
  const multiplier = conditionMultipliers[condition] || 0.30;
  const estimatedValue = Math.round(comic.baseValue * multiplier);
  res.json({ ...comic, condition, conditionLabel: conditionLabels[condition], estimatedValue });
});

// ─── AUTH ─────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
  if (password.length < 6) return res.status(400).json({ error: 'La password deve avere almeno 6 caratteri' });
  const users = readJSON(USERS_FILE);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(400).json({ error: 'Email già registrata' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), email: email.toLowerCase(), name, password: hashedPassword, createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON(USERS_FILE, users);
  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e password obbligatori' });
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Email o password errati' });
  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json(null);
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.json(null);
  res.json({ id: user.id, email: user.email, name: user.name });
});

// ─── COLLECTION ───────────────────────────────────────────────
app.get('/api/collection', requireAuth, (req, res) => {
  const collections = readJSON(COLLECTIONS_FILE);
  res.json(collections[req.session.userId] || []);
});

app.post('/api/collection', requireAuth, (req, res) => {
  const { comicId, condition, notes } = req.body;
  const comic = comicsDB.find(c => c.id === parseInt(comicId));
  if (!comic) return res.status(404).json({ error: 'Fumetto non trovato' });
  const multiplier = conditionMultipliers[condition] || 0.30;
  const estimatedValue = Math.round(comic.baseValue * multiplier);
  const collections = readJSON(COLLECTIONS_FILE);
  if (!collections[req.session.userId]) collections[req.session.userId] = [];
  const entry = {
    id: uuidv4(),
    comicId: comic.id,
    series: comic.series,
    number: comic.number,
    title: comic.title,
    publisher: comic.publisher,
    year: comic.year,
    category: comic.category,
    condition,
    conditionLabel: conditionLabels[condition],
    estimatedValue,
    notes: notes || '',
    addedAt: new Date().toISOString()
  };
  collections[req.session.userId].push(entry);
  writeJSON(COLLECTIONS_FILE, collections);
  res.json(entry);
});

app.delete('/api/collection/:itemId', requireAuth, (req, res) => {
  const collections = readJSON(COLLECTIONS_FILE);
  if (!collections[req.session.userId]) return res.status(404).json({ error: 'Collezione vuota' });
  collections[req.session.userId] = collections[req.session.userId].filter(i => i.id !== req.params.itemId);
  writeJSON(COLLECTIONS_FILE, collections);
  res.json({ ok: true });
});

// ─── PUBLIC SHARE ─────────────────────────────────────────────
app.get('/api/share/:userId', (req, res) => {
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });
  const collections = readJSON(COLLECTIONS_FILE);
  const userCollection = collections[req.params.userId] || [];
  const totalValue = userCollection.reduce((sum, i) => sum + i.estimatedValue, 0);
  res.json({ owner: user.name, collection: userCollection, totalValue, count: userCollection.length });
});

// ─── WAITLIST ─────────────────────────────────────────────────
app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email non valida' });
  const waitlist = readJSON(WAITLIST_FILE);
  if (!waitlist.includes(email.toLowerCase())) {
    waitlist.push(email.toLowerCase());
    writeJSON(WAITLIST_FILE, waitlist);
  }
  res.json({ ok: true });
});

// ─── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ FumettoQuota in esecuzione su http://localhost:${PORT}`);
  console.log(`📚 Database: ${comicsDB.length} fumetti caricati`);
});
