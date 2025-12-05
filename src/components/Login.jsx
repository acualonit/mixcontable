import React, { useState } from 'react';
import { login as loginRequest, saveUser } from '../utils/authApi';

const Login = ({ onLoggedIn }) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const data = await loginRequest(email, password);
			saveUser(data.user);
			onLoggedIn && onLoggedIn(data.user);
		} catch (err) {
			console.error('Error login:', err);
			setError(err.message || 'Error al iniciar sesión');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="login-page">
			<div className="login-box">
				<h2>MIXCONTABLE</h2>
				<h3>Acceso al sistema contable</h3>

				{error && <div className="login-error">{error}</div>}

				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label>Correo electrónico</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="email"
							placeholder="ejemplo@dominio.local"
						/>
					</div>

					<div className="form-group">
						<label>Contraseña</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							placeholder="Tu contraseña"
						/>
					</div>

					<button type="submit" disabled={loading}>
						{loading ? 'Ingresando…' : 'Ingresar'}
					</button>
				</form>

				<div className="login-footnote">
					Inicia sesión con tus credenciales asignadas.
				</div>
			</div>
		</div>
	);
};

export default Login;
