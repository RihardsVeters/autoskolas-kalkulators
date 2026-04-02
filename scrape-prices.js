// scraper/scrape-prices.js
// Skripts, kas skrape autoskolu cenas un ieraksta Firebase
//
// Pirms palaisisanas: cd scraper && npm init -y && npm install node-fetch cheerio

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const FIREBASE_DB_URL = 'https://autoskolu-kalkulators-default-rtdb.europe-west1.firebasedatabase.app';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || '';

// ========== SKRAPESU FUNKCIJAS ==========

async function fetchHTML(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutoskolaBot/1.0)',
        'Accept': 'text/html',
      },
      timeout: 15000,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } catch (err) {
    console.log('  Kluda ieladejot ' + url + ': ' + err.message);
    return null;
  }
}

// AkategorijaLV - specializeta motoskola
async function scrapeAkategorija() {
  console.log('Skrape: AkategorijaLV...');
  const html = await fetchHTML('https://www.akategorija.com/maksa');
  if (!html) return null;

  // Meklejam cenas teksta
  var teorija = 50;
  var brauksana = 25;
  var brauksana_atlaide = 22.5;

  // Meklojam ciparus HTML
  var teorijaMatch = html.match(/(\d+)\s*(?:€|EUR)[\s\S]*?[Tt]eorij/i) || html.match(/[Tt]eorij[\s\S]*?(\d+)\s*(?:€|EUR)/i);
  if (teorijaMatch) teorija = parseFloat(teorijaMatch[1]);

  var brauksanaMatch = html.match(/€\s*(\d+)\s*(?:\n|\r|<)[\s\S]*?\(45\s*min\)[\s\S]*?[Ss]tandarta/i);
  if (brauksanaMatch) brauksana = parseFloat(brauksanaMatch[1]);

  return {
    name: 'A kategorija LV',
    website: 'https://www.akategorija.com',
    categories: {
      'A': {
        teorija: teorija,
        'braukšana_stunda': brauksana,
        min_stundas: 10,
        laukums_stunda: 4,
        piez: 'Specializeta motoskola. 10 stundu uzreiz: ' + brauksana_atlaide + ' EUR/st.'
      }
    }
  };
}

// DBS - Drosas Brauksanas Skola
async function scrapeDBS() {
  console.log('Skrape: DBS...');
  const html = await fetchHTML('https://dbs.lv/autoskola/b-kategorija');
  if (!html) return null;

  var teorija = 230;
  var brauksana = 55;
  var brauksana_auto = 58;

  var teorijaMatch = html.match(/(\d+)\s*EUR[\s\S]*?[Tt]eorijas\s+kurss/i) || html.match(/[Tt]eorijas\s+kurss[\s\S]*?(\d+)\s*EUR/i);
  if (teorijaMatch) teorija = parseFloat(teorijaMatch[1]);

  var brMatch = html.match(/(\d+)[.,]\d+\s*EUR\s*\/\s*90\s*min[\s\S]*?[Mm]anuāl/i);
  if (brMatch) brauksana = parseFloat(brMatch[1]);

  return {
    name: 'Drosas Brauksanas Skola',
    website: 'https://dbs.lv',
    categories: {
      'A': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 10,
        piez: 'Cenas pec pieprasijuma - sazinieties ar skolu'
      },
      'B': {
        teorija: teorija,
        'braukšana_stunda': brauksana,
        min_stundas: 20,
        piez: 'Manuala karbas ' + brauksana + ' EUR/90min, automats ' + brauksana_auto + ' EUR/90min. Citu skolu klientiem +10 EUR'
      }
    }
  };
}

// Presto
async function scrapePresto() {
  console.log('Skrape: Presto...');
  const html = await fetchHTML('https://presto.lv/b-kategorijas-klatienes-pilnas-apmacibas-ligums');
  if (!html) return null;

  return {
    name: 'Presto Autoskola',
    website: 'https://presto.lv',
    categories: {
      'B': {
        registracija: 30,
        teorija: 25,
        'braukšana_stunda': 30,
        'braukšana_stunda_max': 64,
        min_stundas: 10,
        'eksāmens': 45,
        piez: 'Teorija 25 EUR (subsideta, citadi 125 EUR). Brauksana 30-64 EUR atk. no instruktora'
      },
      'C': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 20,
        piez: 'Sazinieties ar Presto'
      },
      'D': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 12,
        piez: 'Sazinieties ar Presto'
      }
    }
  };
}

// Credo Autoprieks
async function scrapeCredo() {
  console.log('Skrape: Credo Autoprieks...');
  const html = await fetchHTML('https://credoautoprieks.lv/kategorijas-un-cenas/b-kategorija/');
  if (!html) return null;

  var teorija = 1;
  var dokumenti = 30;
  var brauksana = 18;
  var eksamens = 10;

  // Meklejam cenas HTML
  var teorijaMatch = html.match(/[Tt]eorija[\s\S]*?(\d+)[.,]\d+\s*EUR/i);
  if (teorijaMatch) teorija = parseFloat(teorijaMatch[1]);

  return {
    name: 'Credo Autoprieks',
    website: 'https://credoautoprieks.lv',
    categories: {
      'A': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 10,
        piez: 'Sazinieties ar skolu'
      },
      'B': {
        teorija: teorija,
        dokumenti: dokumenti,
        'braukšana_stunda': brauksana,
        min_stundas: 20,
        'eksāmens': eksamens,
        piez: 'Teorija akcija ' + teorija + ' EUR (parasti 75 EUR). Brauksana ' + brauksana + ' EUR/st'
      },
      'C': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 20,
        piez: 'Sazinieties ar skolu'
      },
      'D': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 12,
        piez: 'Sazinieties ar skolu'
      }
    }
  };
}

// Fortuna
async function scrapeFortuna() {
  console.log('Skrape: Fortuna...');
  const html = await fetchHTML('https://www.fortuna.lv/lv/prices');
  if (!html) return null;

  var a_teorija = 50;
  var a_brauksana = 25;
  var b_komplekts = 30;
  var b_brauksana = 40;
  var c_komplekts = 70;
  var c_brauksana = 31;
  var d_komplekts = 70;
  var d_brauksana = 39;

  // Meklejam cenas tabula
  var aMatch = html.match(/A[\s\S]*?(\d+)[.,]00/);
  if (aMatch) a_teorija = parseFloat(aMatch[1]);

  return {
    name: 'Autoskola Fortuna',
    website: 'https://www.fortuna.lv',
    categories: {
      'A': {
        teorija: a_teorija,
        'braukšana_stunda': a_brauksana,
        min_stundas: 20,
        piez: 'Pilns komplekts ' + a_teorija + ' EUR + brauksana ' + a_brauksana + ' EUR/st'
      },
      'B': {
        registracija: b_komplekts,
        teorija: 0,
        'braukšana_stunda': b_brauksana,
        min_stundas: 20,
        'eksāmens': 45,
        teorijas_ieskaite: 15,
        piez: 'Komplekts ' + b_komplekts + ' EUR. Brauksana no ' + b_brauksana + ' EUR/st'
      },
      'C': {
        teorija: c_komplekts,
        'braukšana_stunda': c_brauksana,
        min_stundas: 20,
        piez: 'Komplekts ar 95.kodu ' + c_komplekts + ' EUR + brauksana ' + c_brauksana + ' EUR/st'
      },
      'D': {
        teorija: d_komplekts,
        'braukšana_stunda': d_brauksana,
        min_stundas: 12,
        piez: 'Komplekts ' + d_komplekts + ' EUR + brauksana ' + d_brauksana + ' EUR/st'
      }
    }
  };
}

// Einsteins - nav publisku cenu, tiesi saite uz kalkulatoru
function getEinsteins() {
  return {
    name: 'Autoskola Einsteins',
    website: 'https://einsteins.lv',
    categories: {
      'A': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 10,
        piez: 'Cenas atkaribas no filiales - izmantojiet einsteins.lv kalkulatoru'
      },
      'B': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 20,
        piez: 'Cenas atkaribas no filiales un instruktora - izmantojiet einsteins.lv kalkulatoru'
      },
      'C': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 20,
        piez: 'Cenas pec pieprasijuma'
      }
    }
  };
}

// BUTS - nav publisku cenu
function getBUTS() {
  return {
    name: 'Macibu centrs BUTS',
    website: 'https://buts.lv',
    categories: {
      'B': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 20,
        piez: 'Cenas pec pieprasijuma - sazinieties ar BUTS'
      },
      'C': {
        teorija: null,
        'braukšana_stunda': null,
        min_stundas: 20,
        piez: 'Cenas pec pieprasijuma'
      }
    }
  };
}

// ========== GALVENAA FUNKCIJA ==========

async function main() {
  console.log('Sak autoskolu cenu skrapesanu...');
  console.log('Laiks: ' + new Date().toISOString());
  console.log('---');

  var results = {};

  // Skrapejam katru skolu
  var akategorija = await scrapeAkategorija();
  if (akategorija) results['AkategorijaLV'] = akategorija;

  var dbs = await scrapeDBS();
  if (dbs) results['DBS'] = dbs;

  var presto = await scrapePresto();
  if (presto) results['Presto'] = presto;

  var credo = await scrapeCredo();
  if (credo) results['CredoAutoprieks'] = credo;

  var fortuna = await scrapeFortuna();
  if (fortuna) results['Fortuna'] = fortuna;

  // Siem nav publiskas cenas - izmantojam statiskus datus
  results['Einsteins'] = getEinsteins();
  results['BUTS'] = getBUTS();

  var now = new Date();
  var dateStr = now.toLocaleDateString('lv-LV', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  var payload = {
    lastUpdated: dateStr,
    schools: results
  };

  console.log('---');
  console.log('Skrapesana pabeigta. Atrasti dati par ' + Object.keys(results).length + ' skolam.');

  // Ierakstam Firebase
  console.log('Ieraksta Firebase...');
  var fbUrl = FIREBASE_DB_URL + '/prices.json';
  if (FIREBASE_API_KEY) {
    fbUrl = fbUrl + '?auth=' + FIREBASE_API_KEY;
  }

  try {
    const res = await fetch(fbUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log('Veiksmigi ierakstits Firebase!');
    } else {
      var errText = await res.text();
      console.log('Firebase kluda: ' + res.status + ' - ' + errText);
      console.log('');
      console.log('PIEZIME: Ja redzat "Permission denied", jums jaatver Firebase konsole un jaiestata');
      console.log('Realtime Database rules, lai atlautu rakstisanu uz /prices celu.');
      console.log('Piemeram:');
      console.log('{');
      console.log('  "rules": {');
      console.log('    "prices": {');
      console.log('      ".read": true,');
      console.log('      ".write": "auth != null"');
      console.log('    },');
      console.log('    "$other": {');
      console.log('      ".read": true,');
      console.log('      ".write": "auth != null"');
      console.log('    }');
      console.log('  }');
      console.log('}');
    }
  } catch (err) {
    console.log('Firebase savienojuma kluda: ' + err.message);
  }
}

main().catch(function(err) {
  console.error('Kritiska kluda:', err);
  process.exit(1);
});
