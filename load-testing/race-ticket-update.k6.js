import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USER_ID = __ENV.USER_ID || 'db6926e9-3740-4305-a744-022807f6e577';

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

export function setup() {
  const createRes = http.post(
    `${BASE_URL}/api/v1/tickets`,
    JSON.stringify({
      userId: USER_ID,
      title: 'Race condition setup ticket',
      description: 'Created by k6 setup for concurrent PATCH test.',
      status: 'OPEN',
    }),
    { headers: { 'Content-Type': 'application/json' } },
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
    headers: { 'Content-Type': 'application/json' },
  });

  const ok200 = res.status === 200;
  const ok409 = res.status === 409;

  if (ok200) patchWins.add(1);
  if (ok409) patchConflicts.add(1);

  check(res, {
    'winner or conflict': (r) => r.status === 200 || r.status === 409,
  });
}
