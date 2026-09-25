
import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '30s', target: 25 },
    { duration: '15s', target: 0 },
  ],

  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const url = 'http://localhost:3000/payments';

  const idempotencyKey = uuidv4();

  const payload = JSON.stringify({
    receiver_id: '13',
    amount: '10.00',
    currency: 'INR',
    notes: 'Local load test',
  });

  const jwtToken = ""; // Replace with your actual JWT token

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
      'idempotency_key': idempotencyKey,
    },
  };

  const response = http.post(url, payload, params);

  check(response, {
    'payment request accepted': (r) =>
      r.status === 200 || r.status === 201 || r.status === 202,
  });

  sleep(0.1);
}