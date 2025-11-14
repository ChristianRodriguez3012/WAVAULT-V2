import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  vus: 50, // 50 usuarios virtuales simultáneos
  duration: '2m', // duración total de la prueba
};

export default function () {
  // Visitar la página de login
  let res = http.get('http://localhost:3000/login.html');
  check(res, { 'login page OK': (r) => r.status === 200 });

  // Obtener lista de beats
  res = http.get('http://localhost:3000/beats');
  check(res, { 'beats OK': (r) => r.status === 200 });

  // Intento de login (puede devolver 200 o 401 según credenciales)
  const payload = JSON.stringify({ email: 'load@test.local', password: 'password' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  res = http.post('http://localhost:3000/login', payload, params);
  check(res, { 'login responded': (r) => r.status === 200 || r.status === 401 || r.status === 400 });

  // Pequeña espera para simular comportamiento real
  sleep(1);
}
