import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Métricas personalizadas
const logicalErrorRate = new Rate('logical_error_rate'); // fallos de checks (status/token/etc.)
const responseTime = new Trend('response_time');

// Cargar datos desde CSV (formato requerido: user,passwd)
const users = new SharedArray('users', function () {
  const data = open('./data/users.csv');
  const lines = data.split('\n').slice(1); // saltar header
  return lines
    .filter(line => line.trim() !== '')
    .map(line => {
      const parts = line.split(',');
      return {
        user: (parts[0] || '').trim(),
        passwd: (parts[1] || '').trim(),
      };
    })
    .filter(u => u.user && u.passwd);
});

// Configuración del escenario (20 TPS)
export const options = {
  scenarios: {
    load_test: {
      executor: 'constant-arrival-rate',
      rate: 20,            // 20 TPS
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 25,
      maxVUs: 50,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'], // p(95) < 1.5s (percentil 95)
    http_req_failed: ['rate<0.03'],    // < 3% fallos HTTP
    logical_error_rate: ['rate<0.03'], // < 3% fallos lógicos (opcional, pero queda pro)
  },
};

// URL del servicio de login (FakeStore)
// CURL proporcionado:
// curl --location --max-time 60 'https://fakestoreapi.com/auth/login'
// --header 'Content-Type: application/json'
// --data '{ "username": "user", "password": "passwd" }'
const LOGIN_URL = 'https://fakestoreapi.com/auth/login';

export default function () {
  const u = users[Math.floor(Math.random() * users.length)];

  const headers = { 'Content-Type': 'application/json' };

  // FakeStore espera { username, password }
  // Mapeo CSV -> payload:
  // user   -> username
  // passwd -> password
  const payload = JSON.stringify({
    username: u.user,
    password: u.passwd,
  });

  const res = http.post(LOGIN_URL, payload, {
    headers,
    tags: { name: 'login' },
    timeout: '10s',
  });

  responseTime.add(res.timings.duration);

  // Checks funcionales (para tasa de error lógica)
  const functionalOk = check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!body.token;
      } catch (_) {
        return false;
      }
    },
  });

  // Check de performance (informativo)
  check(res, {
    'response time <= 1.5s': (r) => r.timings.duration <= 1500,
  });

  logicalErrorRate.add(!functionalOk);

  // Debug opcional
  if (!functionalOk) {
    console.log(`Fail: status=${res.status}, user=${u.user}`);
  }
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs?.values?.count ?? 0;
  const failRate = data.metrics.http_req_failed?.values?.rate ?? 0;
  const approxFailed = Math.round(totalReqs * failRate);

  const summary = {
    'Total Requests': totalReqs,
    'Approx Failed Requests': approxFailed,
    'Error Rate (http_req_failed %)': (failRate * 100).toFixed(2),
    'Avg Response Time (ms)': (data.metrics.http_req_duration?.values?.avg ?? 0).toFixed(2),
    'Min Response Time (ms)': (data.metrics.http_req_duration?.values?.min ?? 0).toFixed(2),
    'Max Response Time (ms)': (data.metrics.http_req_duration?.values?.max ?? 0).toFixed(2),
    'P95 Response Time (ms)': (data.metrics.http_req_duration?.values?.['p(95)'] ?? 0).toFixed(2),
    'Requests per Second (http_reqs.rate)': (data.metrics.http_reqs?.values?.rate ?? 0).toFixed(2),
  };

  console.log('\n========== RESUMEN DE LA PRUEBA ==========');
  for (const [k, v] of Object.entries(summary)) console.log(`${k}: ${v}`);
  console.log('==========================================\n');

  return {
    'reports/summary.json': JSON.stringify(data, null, 2),
    'reports/textSummary.txt': textSummary(data, { indent: ' ', enableColors: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}