/**
 * Génère les captures d'écran de l'app pour le README, pour chaque rôle.
 *
 * Prérequis :
 *   - l'app tourne (ex. http://localhost:8088) avec des assets compilés
 *   - puppeteer installé côté host :  npm install --no-save puppeteer
 *
 * Lancement :  node scripts/screenshots.mjs
 *
 * Sortie : docs/screenshots/{guest,practitioner,patient}/*.png
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const BASE = process.env.APP_URL_LOCAL || 'http://localhost:8088';
const OUT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'docs',
    'screenshots',
);

const PRACTITIONER = { email: 'praticien@consulteoo.test', password: 'password' };
const PATIENT = { email: 'patient@consulteoo.test', password: 'password' };

async function login(page, { email, password }) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
    await page.type('#email', email);
    await page.type('#password', password);
    await Promise.all([
        page.waitForFunction(() => !location.pathname.includes('/login'), {
            timeout: 15000,
        }),
        page.keyboard.press('Enter'),
    ]);
}

async function clearSession(page) {
    const cookies = await page.cookies();
    if (cookies.length) {
        await page.deleteCookie(...cookies);
    }
}

async function shot(page, url, file) {
    const dest = path.join(OUT, file);
    await mkdir(path.dirname(dest), { recursive: true });
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 700)); // laisse le rendu se stabiliser
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`  ✓ ${file}`);
}

// Réserve le premier créneau disponible (pour que "Mes rendez-vous" patient ne soit pas vide).
async function bookFirstSlot(page) {
    await page.goto(`${BASE}/book`, { waitUntil: 'networkidle0' });
    const clicked = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) =>
            /Réserver|Book/.test(b.textContent || ''),
        );
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });
    if (clicked) await new Promise((r) => setTimeout(r, 1400));
}

const browser = await puppeteer.launch({ headless: true });

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });

    console.log(`Cible : ${BASE}\n`);

    // --- Guest (déconnecté) ---
    console.log('Guest');
    await shot(page, '/login', 'guest/login.png');
    await shot(page, '/register', 'guest/register.png');

    // --- Praticien ---
    console.log('Praticien');
    await login(page, PRACTITIONER);
    await shot(page, '/dashboard', 'practitioner/dashboard.png');
    await shot(page, '/slots', 'practitioner/slots.png');
    await shot(page, '/appointments', 'practitioner/appointments.png');
    await shot(page, '/profile', 'practitioner/profile.png');

    // --- Patient ---
    console.log('Patient');
    await clearSession(page);
    await login(page, PATIENT);
    await shot(page, '/dashboard', 'patient/dashboard.png');
    await shot(page, '/book', 'patient/book.png');
    await bookFirstSlot(page); // peuple "Mes rendez-vous"
    await shot(page, '/appointments', 'patient/appointments.png');
    await shot(page, '/profile', 'patient/profile.png');

    console.log(`\nCaptures enregistrées dans ${OUT}`);
} finally {
    await browser.close();
}
