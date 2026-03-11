// Mocked benchmark to measure parallel vs sequential operations

async function mockUpload() {
  return new Promise(resolve => setTimeout(resolve, 500)); // Simulating 500ms network latency
}

async function runSequential() {
  const start = Date.now();
  const items = [1, 2, 3];
  for (const item of items) {
    await mockUpload();
  }
  return Date.now() - start;
}

async function runParallel() {
  const start = Date.now();
  const items = [1, 2, 3];
  await Promise.all(items.map(mockUpload));
  return Date.now() - start;
}

async function main() {
  console.log("Benchmarking Sequential vs Parallel Uploads...");

  const seqTime = await runSequential();
  console.log(`Sequential Time: ${seqTime}ms`);

  const parTime = await runParallel();
  console.log(`Parallel Time: ${parTime}ms`);

  console.log(`Improvement: ~${Math.round((seqTime - parTime) / seqTime * 100)}% faster`);
}

main();
