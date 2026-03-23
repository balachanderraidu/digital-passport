const https = require('https');

https.get('https://api.github.com/repos/balachanderraidu/digital-passport/actions/runs', {
  headers: { 'User-Agent': 'node.js' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const runs = JSON.parse(data).workflow_runs;
    const recent = runs.slice(0, 3);
    console.log(recent.map(r => `${r.name} | id: ${r.id} | status: ${r.status} | conclusion: ${r.conclusion}`).join('\n'));
    
    // Fetch logs for the first failed one
    const failed = recent.find(r => r.conclusion === 'failure');
    if (failed) {
      https.get(`https://api.github.com/repos/balachanderraidu/digital-passport/actions/runs/${failed.id}/jobs`, {
        headers: { 'User-Agent': 'node.js' }
      }, (jobRes) => {
        let jobData = '';
        jobRes.on('data', chunk => jobData += chunk);
        jobRes.on('end', () => {
          const jobs = JSON.parse(jobData).jobs;
          const failedJob = jobs.find(j => j.conclusion === 'failure');
          if (failedJob) {
            console.log(`\nFailed Job: ${failedJob.name}`);
            console.log(`Failed Step: ${failedJob.steps.find(s => s.conclusion === 'failure')?.name}`);
          }
        });
      });
    }
  });
});
