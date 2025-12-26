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
	// Intentar primero rutas relativas para aprovechar el proxy de Vite
	// (evita problemas CORS y URL absolutas durante el desarrollo).
	try {
		return await doFetch(`/api/login`, { email, password });
	} catch (err) {
		// Si falla, intentar ruta relativa alternativa
		try {
			return await doFetch(`/api/dev-login`, { email, password });
		} catch (err2) {
			// Finalmente usar la URL absoluta de fallback
			try {
				return await doFetch(`${FALLBACK_API}/login`, { email, password });
			} catch (err3) {
				try {
					return await doFetch(`${FALLBACK_API}/dev-login`, { email, password });
				} catch (err4) {
					throw err4;
				}
			}
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
