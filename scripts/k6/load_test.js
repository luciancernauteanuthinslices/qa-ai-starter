import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800']
  }
};

export default function () {
  const base = __ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
  const res = http.get(`${base}/web/index.php/dashboard/index`);
  check(res, { 'status 200': r => r.status === 200 });
  sleep(1);
}
