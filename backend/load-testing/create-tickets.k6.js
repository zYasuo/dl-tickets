import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

function obtainAccessToken(baseUrl) {
  const token = __ENV.ACCESS_TOKEN;
  if (token) return token;
  const email = __ENV.LOGIN_EMAIL;
  const password = __ENV.LOGIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set ACCESS_TOKEN or both LOGIN_EMAIL and LOGIN_PASSWORD (user must exist — e.g. POST /api/v1/users then login).',
    );
  }
  const res = http.post(
    `${baseUrl}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.status !== 200) {
    throw new Error(`login failed status=${res.status} body=${res.body}`);
  }
  const envelope = JSON.parse(res.body);
  return envelope.data.accessToken;
}

export function setup() {
  return { baseUrl: BASE_URL, token: obtainAccessToken(BASE_URL) };
}

export default function (data) {
  const payload = JSON.stringify({
    title: `k6 load vu${__VU} iter${__ITER} ${Date.now()}`,
    description: 'Load test ticket created by k6.',
  });

  const res = http.post(`${data.baseUrl}/api/v1/tickets`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  });

  check(res, {
    'status 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  sleep(0.05);
}
