import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const patchWins = new Counter('race_patch_200');
const patchConflicts = new Counter('race_patch_409');

const parallel = Number(__ENV.PARALLEL || 50);

export const options = {
  scenarios: {
    race_updates: {
      executor: 'shared-iterations',
      vus: parallel,
      iterations: parallel,
      maxDuration: '120s',
    },
  },
  thresholds: {
    race_patch_200: ['count==1'],
    race_patch_409: [`count==${parallel - 1}`],
  },
};

function obtainAccessToken(baseUrl) {
  const token = __ENV.ACCESS_TOKEN;
  if (token) return token;
  const email = __ENV.LOGIN_EMAIL;
  const password = __ENV.LOGIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set ACCESS_TOKEN or both LOGIN_EMAIL and LOGIN_PASSWORD (same user must own the ticket created in setup).',
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
  return JSON.parse(res.body).data.accessToken;
}

export function setup() {
  const token = obtainAccessToken(BASE_URL);
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const createRes = http.post(
    `${BASE_URL}/api/v1/tickets`,
    JSON.stringify({
      title: 'Race condition setup ticket',
      description: 'Created by k6 setup for concurrent PATCH test.',
    }),
    { headers: authHeaders },
  );

  if (createRes.status < 200 || createRes.status >= 300) {
    throw new Error(
      `setup: create ticket failed status=${createRes.status} body=${createRes.body}`,
    );
  }

  const envelope = JSON.parse(createRes.body);
  const ticket = envelope.data;
  return {
    baseUrl: BASE_URL,
    token,
    ticketId: ticket.id,
    updatedAt: ticket.updatedAt,
  };
}

export default function (data) {
  const payload = JSON.stringify({
    title: `Race vu${__VU} iter${__ITER} ${Date.now()}`,
    description: 'Concurrent optimistic-lock update test.',
    status: 'IN_PROGRESS',
    updatedAt: data.updatedAt,
  });

  const res = http.patch(`${data.baseUrl}/api/v1/tickets/${data.ticketId}`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  });

  const ok200 = res.status === 200;
  const ok409 = res.status === 409;

  if (ok200) patchWins.add(1);
  if (ok409) patchConflicts.add(1);

  check(res, {
    'winner or conflict': (r) => r.status === 200 || r.status === 409,
  });
}
