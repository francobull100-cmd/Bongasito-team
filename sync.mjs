// Trae fixtures y resultados de la Primera División de Chile desde la API pública de ESPN
// (gratis, sin clave) y los guarda en Supabase. Corre solo con GitHub Actions. Node 20+, sin dependencias.
//
// Variables de entorno:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (obligatorias)
//   SEASON      (opcional; por defecto el año actual en Chile, la liga se juega dentro del año calendario)
//   ESPN_LEAGUE (opcional; por defecto chi.1 = Primera División de Chile)

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!v) { console.error(`Falta la variable ${k}`); process.exit(1); }
}
const LEAGUE = process.env.ESPN_LEAGUE || 'chi.1';
const SEASON = Number(process.env.SEASON ||
  new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: 'America/Santiago' }).format(new Date()));

// Un mes por consulta para no topar con límites de tamaño.
const events = new Map();
for (let m = 1; m <= 12; m++) {
  const mm = String(m).padStart(2, '0');
  const last = new Date(Date.UTC(SEASON, m, 0)).getUTCDate();
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${LEAGUE}/scoreboard` +
    `?dates=${SEASON}${mm}01-${SEASON}${mm}${last}&limit=500`;
  const r = await fetch(url);
  if (!r.ok) { console.error(`ESPN respondió ${r.status} para ${SEASON}-${mm}`); process.exit(1); }
  const body = await r.json();
  for (const ev of body.events || []) events.set(String(ev.id), ev);
}
if (events.size === 0) {
  console.error(`ESPN no devolvió partidos para ${LEAGUE}, temporada ${SEASON}.`);
  process.exit(1);
}

const rows = [];
for (const ev of events.values()) {
  const comp = (ev.competitions || [])[0];
  if (!comp) continue;
  const home = comp.competitors.find((c) => c.homeAway === 'home');
  const away = comp.competitors.find((c) => c.homeAway === 'away');
  if (!home || !away) continue;
  const type = (ev.status && ev.status.type) || {};
  const done = type.completed === true;
  const hg = Number.parseInt(home.score, 10);
  const ag = Number.parseInt(away.score, 10);
  rows.push({
    id: Number(ev.id),
    season: SEASON,
    round: ev.week && Number.isInteger(ev.week.number) ? ev.week.number : null,
    home: home.team.displayName || home.team.name,
    away: away.team.displayName || away.team.name,
    kickoff: new Date(ev.date).toISOString(),
    status: type.name || null,
    hg: done && Number.isInteger(hg) ? hg : null,
    ag: done && Number.isInteger(ag) ? ag : null,
    updated_at: new Date().toISOString(),
  });
}

// Las claves JWT (anon/service_role clásicas) van también en Authorization; las nuevas sb_secret_ solo en apikey.
const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=minimal',
};
if (SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

for (let i = 0; i < rows.length; i += 200) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/matches?on_conflict=id`, {
    method: 'POST', headers, body: JSON.stringify(rows.slice(i, i + 200)),
  });
  if (!r.ok) { console.error('Supabase rechazó la escritura:', r.status, await r.text()); process.exit(1); }
}
const finished = rows.filter((x) => x.hg != null).length;
console.log(`Listo: ${rows.length} partidos de la temporada ${SEASON} (${finished} con resultado).`);
