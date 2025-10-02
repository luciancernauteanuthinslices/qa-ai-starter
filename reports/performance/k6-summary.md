# 🚀 k6 Performance Test Summary

**Status:** ❌ **FAILED**
**Environment:** https://opensource-demo.orangehrmlive.com
**Duration:** 87s | **Max VUs:** 20 | **Total Requests:** 726
**Run ID:** local | **Branch:** dev

## 📊 Key Performance Metrics
- **Response Time (p95):** 238ms
- **Error Rate:** 0.00%
- **Checks Passed:** 726/1210 (60.0%)
- **Throughput:** 8.34 req/s

## 🎯 Threshold Results
- **http_req_duration**: ✅ (238ms)
- **login_errors**: ❌ (100.00%)
- **http_req_duration{test_type:smoke}**: ✅ (313ms)
- **checks**: ❌ (60.00%)
- **dashboard_load_time**: ✅ (455ms)
- **http_req_failed**: ✅ (0.00%)

## 📈 Scenario Breakdown
- **SMOKE**: p95 = 313ms
- **DEFAULT**: p95 = 238ms

## ⚠️ Performance Issues Detected
- Review error rates and response times
- Check application performance
- Consider scaling resources

---
*Generated at: 2025-08-26T20:30:03.813Z*