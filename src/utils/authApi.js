import { API_BASE_URL } from './configApi';

// API relativa (usa proxy de Vite en dev) o valor de VITE_API_URL
const RELATIVE_API = API_BASE_URL || '/api';
// URL absoluta del backend como fallback (puedes definir VITE_BACKEND_URL en .env)
const ABSOLUTE_BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000/api';

async function doFetch(url, body) {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		credentials: 'include',
	});

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		const msg = data.message || res.statusText || 'Error al iniciar sesión';
		const err = new Error(msg);
		err.status = res.status;
		throw err;
	}

	return res.json();
}

async function tryLoginOn(urlBase, email, password) {
	const base = urlBase.replace(/\/$/, '');
	const candidates = [`${base}/login`, `${base}/dev-login`, `${base}/dev-public-login`, `${base}/dev-public-dev-login`];

	let lastErr = null;
	for (const endpoint of candidates) {
		try {
			return await doFetch(endpoint, { email, password });
		} catch (err) {
			lastErr = err;
			if (err.status === 404) {
				// probar siguiente candidato
				continue;
			}
			// si es otro error (401, 500), propagar inmediatamente
			throw err;
		}
	}

	// Si llegamos aquí todos devolvieron 404 o fallaron, lanzar el último error
	throw lastErr || new Error('Login failed');
}

export async function login(email, password) {
	// 1) intentar via proxy/relative (dev)
	try {
		return await tryLoginOn(RELATIVE_API, email, password);
	} catch (err) {
		// si es 404 o falla, intentar directamente el backend absoluto (usa CORS config en backend)
		try {
			return await tryLoginOn(ABSOLUTE_BACKEND, email, password);
		} catch (err2) {
			throw err2;
		}
	}
}

export function saveUser(user) {
	localStorage.setItem('user', JSON.stringify(user));
}

export function getSavedUser() {
	const raw = localStorage.getItem('user');
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch (e) {
		return null;
	}
}

export function clearUser() {
	localStorage.removeItem('user');
}

export async function logout() {
	try {
		// intentar via proxy primero
		await fetch(`${RELATIVE_API.replace(/\/$/, '')}/logout`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
		});
	} catch (error) {
		try {
			// intentar con backend absoluto
			await fetch(`${ABSOLUTE_BACKEND.replace(/\/$/, '')}/logout`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
			});
		} catch (error2) {
			console.error('Error al cerrar sesión', error2);
		}
	}
}
