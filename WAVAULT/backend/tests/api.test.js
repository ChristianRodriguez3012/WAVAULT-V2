const request = require('supertest');
const app = require('../app'); // Asegúrate de que la ruta al archivo de tu aplicación sea correcta

describe('Pruebas de Caja Blanca para la API de Express', () => {
	test('GET /ruta-de-ejemplo debe devolver 200', async () => {
		const response = await request(app).get('/ruta-de-ejemplo');
		expect(response.status).toBe(200);
	});

	test('POST /ruta-de-ejemplo debe crear un recurso', async () => {
		const response = await request(app)
			.post('/ruta-de-ejemplo')
			.send({ nombre: 'Ejemplo' });
		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty('id');
	});

	test('GET /ruta-de-ejemplo/:id debe devolver un recurso específico', async () => {
		const response = await request(app).get('/ruta-de-ejemplo/1');
		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('nombre');
	});
});