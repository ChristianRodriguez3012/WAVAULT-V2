#!/usr/bin/env node
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const opts = {
  url: 'http://localhost:3000/beats',
  connections: 50,
  duration: 120, // seconds
  headers: { Accept: 'application/json' }
};

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportsDir = path.join(__dirname, '..', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
const reportMd = path.join(reportsDir, `load-report-${timestamp}.md`);
const reportJson = path.join(reportsDir, `load-report-${timestamp}.json`);
const indexReadme = path.join(reportsDir, 'README.md');

console.log(`Starting load test: ${opts.connections} connections for ${opts.duration}s -> ${opts.url}`);

autocannon(opts, (err, result) => {
  if (err) {
    console.error('Load test failed:', err);
    const errMd = `# Load test failed - ${new Date().toISOString()}\n\nError: ${err.message}\n`;
    fs.writeFileSync(reportMd, errMd);
    appendIndexEntry(indexReadme, reportMd, false);
    process.exit(1);
  }

  const md = buildMdReport(opts, result);
  fs.writeFileSync(reportMd, md);
  fs.writeFileSync(reportJson, JSON.stringify(result, null, 2));
  appendIndexEntry(indexReadme, reportMd, true);

  console.log(`Report written: ${reportMd}`);
});

function buildMdReport(opts, r) {
  return `# Load Report - ${new Date().toISOString()}\n\n` +
    `## Test configuration\n- URL: ${opts.url}\n- Connections: ${opts.connections}\n- Duration: ${opts.duration}s\n\n` +
    `## Summary\n` +
    `- Requests/sec (avg): ${r.requests.average}\n` +
    `- Total requests: ${r.requests.total}\n` +
    `- Latency (ms) avg: ${r.latency.average}, p50: ${r.latency.p50}, p75: ${r.latency.p75}, p95: ${r.latency.p95}, p99: ${r.latency.p99}\n` +
    `- Throughput (bytes/sec avg): ${r.throughput.average}\n` +
    `- Non-2xx responses: ${r.non2xx || 0}\n` +
    `- Errors: ${r.errors || 0}\n` +
    `- Timeouts: ${r.timeouts || 0}\n\n` +
    `## Full result JSON\n\n` +
    '```json\n' + JSON.stringify(r, null, 2) + '\n```\n';
}

function appendIndexEntry(indexPath, reportPath, success) {
  const rel = path.relative(path.join(__dirname, '..'), reportPath).replace(/\\/g, '/');
  const entry = `- [${path.basename(reportPath)}](${rel}) - ${new Date().toISOString()} - ${success ? 'OK' : 'FAIL'}\n`;
  try {
    if (!fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, `# Load Test Reports\n\n${entry}`);
    } else {
      fs.appendFileSync(indexPath, entry);
    }
  } catch (e) {
    console.warn('Could not update index README:', e.message);
  }
}
