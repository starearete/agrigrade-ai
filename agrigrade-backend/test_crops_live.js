const BASE = 'http://localhost:8085';

async function test() {
  const crops = await fetch(`${BASE}/api/v1/crops`).then(r => r.json());
  console.log(`Active Crops count: ${crops.length}\n`);
  for (const c of crops) {
    const vars = await fetch(`${BASE}/api/v1/crops/${c.id}/varieties`).then(r => r.json());
    console.log(`[ID ${c.id}] ${c.name} (${c.code})`);
    console.log(`  - Category: ${c.categoryName}`);
    console.log(`  - Default Storage: "${c.defaultStorageCondition}"`);
    console.log(`  - Base Shelf-Life: ${c.baseShelfLifeDays} Days`);
    console.log(`  - Varieties (${vars.length}): ${vars.map(v => v.name).join(', ')}\n`);
  }
}

test().catch(console.error);
