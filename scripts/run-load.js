#!/usr/bin/env node
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const opts = {
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
    `\
\
\
\
\
\
\
\
\
` + '```json\n' + JSON.stringify(r, null, 2) + '\n```\n';
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
`;
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
