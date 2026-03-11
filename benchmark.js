const args = { dryRun: false };

async function fsSet(docPath, data) {
  // Simulate network delay of 50ms per request
  return new Promise(resolve => setTimeout(resolve, 50));
}

const extracted = {
  unitTypes: Array.from({ length: 20 }, (_, i) => ({
    label: `Type ${i}`,
    carpetArea: 1000 + i * 10,
    superBuiltUpArea: 1200 + i * 10,
    floorPlanPage: i + 1,
    bedrooms: 2,
    bathrooms: 2,
    configuration: 'Standard',
    floorRange: [2, 36],
    flatNumberPattern: ''
  }))
};
const projectId = 'test-project';
const pageToUrl = new Map();

async function runSequential() {
  const start = Date.now();
  for (const ut of extracted.unitTypes) {
    const label   = ut.label ?? 'Unknown'
    const typeId  = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const pageNum = ut.floorPlanPage ?? 0
    const url     = pageNum > 0 ? (pageToUrl.get(pageNum) ?? '') : ''
    const area    = ut.carpetArea > 0 ? ut.carpetArea : (ut.superBuiltUpArea ?? 0)

    if (!args.dryRun) {
      await fsSet(`projects/${projectId}/unitTypes/${typeId}`, {
        label,
        bedrooms: ut.bedrooms ?? 0,
        bathrooms: ut.bathrooms ?? 0,
        area,
        carpetArea: ut.carpetArea ?? 0,
        superBuiltUpArea: ut.superBuiltUpArea ?? 0,
        configuration: ut.configuration ?? '',
        floorRange: ut.floorRange ?? [2, 36],
        flatNumberPattern: ut.flatNumberPattern ?? '',
        genericDocs: url ? [url] : [],
      })
    }
  }
  const end = Date.now();
  console.log(`Sequential time: ${end - start}ms`);
}

async function runConcurrent() {
  const start = Date.now();
  await Promise.all(extracted.unitTypes.map(async (ut) => {
    const label   = ut.label ?? 'Unknown'
    const typeId  = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const pageNum = ut.floorPlanPage ?? 0
    const url     = pageNum > 0 ? (pageToUrl.get(pageNum) ?? '') : ''
    const area    = ut.carpetArea > 0 ? ut.carpetArea : (ut.superBuiltUpArea ?? 0)

    if (!args.dryRun) {
      await fsSet(`projects/${projectId}/unitTypes/${typeId}`, {
        label,
        bedrooms: ut.bedrooms ?? 0,
        bathrooms: ut.bathrooms ?? 0,
        area,
        carpetArea: ut.carpetArea ?? 0,
        superBuiltUpArea: ut.superBuiltUpArea ?? 0,
        configuration: ut.configuration ?? '',
        floorRange: ut.floorRange ?? [2, 36],
        flatNumberPattern: ut.flatNumberPattern ?? '',
        genericDocs: url ? [url] : [],
      })
    }
  }));
  const end = Date.now();
  console.log(`Concurrent time: ${end - start}ms`);
}

async function main() {
  await runSequential();
  await runConcurrent();
}

main().catch(console.error);
