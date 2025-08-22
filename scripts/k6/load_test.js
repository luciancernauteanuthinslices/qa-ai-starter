import http from 'k6/http';
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';

const homeTrend = new Trend('home_response_ms');

export const options = {
  vus: Number(__ENV.K6_VUS || 10),
  duration: __ENV.K6_DURATION || '30s',
};

const BASE = __ENV.BASE_URL || 'https://example.com';

export default function () {
  const res = http.get(BASE);
  homeTrend.add(res.timings.duration);
  sleep(1);
}
