import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USER_ID =
  __ENV.USER_ID || 'db6926e9-3740-4305-a744-022807f6e577';

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  const payload = JSON.stringify({
    userId: USER_ID,
    title: `k6 load vu${__VU} iter${__ITER} ${Date.now()}`,
    description: 'Load test ticket created by k6.',
    status: 'OPEN',
  });

  const res = http.post(`${BASE_URL}/api/v1/tickets`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  sleep(0.05);
}
