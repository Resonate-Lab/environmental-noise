// firebase-auth.js — domain-restricted Google Sign-In gate for Resonate Reflect.
//
// Mirrors the Pattern A flow used across the Resonate Portal apps
// (resonate-portal/src/context/AuthContext.jsx). Restricts access to
// @resonate-consultants.com Google accounts.
//
// Loaded as an ES module from the bottom of index.html.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

const firebaseConfig = {
  apiKey:            'AIzaSyAMKAvUNXI4UZxfKc_i5r-O9wWN-wBvWOw',
  authDomain:        'resonate-reflect.firebaseapp.com',
  projectId:         'resonate-reflect',
  storageBucket:     'resonate-reflect.firebasestorage.app',
  messagingSenderId: '246930744268'
};
const ALLOWED_DOMAIN = 'resonate-consultants.com';

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

try { await setPersistence(auth, browserLocalPersistence); }
catch (e) { console.warn('[auth] setPersistence failed', e); }

const overlay   = document.getElementById('auth-gate');
const appRoot   = document.getElementById('app-root');
const errEl     = document.getElementById('auth-error');
const signInBtn = document.getElementById('auth-signin-btn');
const signOutBtn = document.getElementById('auth-signout-btn');
const userLabel = document.getElementById('auth-user-label');
const userBadge = document.getElementById('auth-user-badge');

function showError(msg) {
  if (!errEl) return;
  errEl.textContent = msg || '';
  errEl.style.display = msg ? 'block' : 'none';
}

function showGate(msg) {
  if (overlay) overlay.style.display = 'flex';
  if (appRoot) appRoot.style.display = 'none';
  showError(msg);
}

function showApp(user) {
  if (overlay) overlay.style.display = 'none';
  if (appRoot) appRoot.style.display = '';
  if (userLabel) userLabel.textContent = user.email || '';
  if (userBadge) userBadge.style.display = 'inline-flex';
  showError('');
  // Notify the rest of the app that auth is ready, in case any module
  // wants to defer work until the user has signed in.
  window.dispatchEvent(new CustomEvent('reflect:auth-ready', { detail: { user } }));
}

if (signInBtn) {
  signInBtn.addEventListener('click', async () => {
    showError('');
    signInBtn.disabled = true;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: ALLOWED_DOMAIN, prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        showError(e.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      signInBtn.disabled = false;
    }
  });
}

if (signOutBtn) {
  signOutBtn.addEventListener('click', () => signOut(auth));
}

onAuthStateChanged(auth, (user) => {
  if (!user) { showGate(); return; }
  if (!user.email || !user.email.toLowerCase().endsWith('@' + ALLOWED_DOMAIN)) {
    signOut(auth);
    showGate('Access restricted to @' + ALLOWED_DOMAIN + ' accounts.');
    return;
  }
  showApp(user);
});

// Expose the current user for any module that needs it (e.g. logging).
window.ReflectAuth = {
  current: () => auth.currentUser,
  signOut: () => signOut(auth)
};
