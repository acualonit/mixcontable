const FALLBACK_API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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

export async function login(email, password) {
	// Forzar uso de la URL absoluta del backend para evitar depender del proxy Vite
	try {
		return await doFetch(`${FALLBACK_API}/login`, { email, password });
	} catch (err) {
		// Si falla, intentar la ruta de desarrollo (no requiere cookies)
		try {
			return await doFetch(`${FALLBACK_API}/dev-login`, { email, password });
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
		await fetch(`${FALLBACK_API}/logout`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
		});
	} catch (error) {
		console.error('Error al cerrar sesión', error);
	}
}
