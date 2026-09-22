const http = require('http');

const token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4NzFjYjgyMi1mOTVlLTQ2YzUtYTQyNC1hZjZhMmFiZjEwZWIiLCJyb2xlcyI6WyJGQVJNRVIiXSwiaWF0IjoxNzg2NDMwMDYzLCJleHAiOjE3ODY1MTY0NjN9.E8M8V_6FSmrijnwmI-57EZAPW7FrnEfVpY92FNOSeQ2c9COMIyqaJ0f7NcLG8JEM6W8reprAIuwaKioo8s77ig';

const req = http.request(
  'http://localhost:8085/api/v1/batches',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  },
  (res) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', () => console.log('BATCH RESP:', res.statusCode, d));
  }
);

req.write(
  JSON.stringify({
    cropId: 1,
    varietyId: 1,
    quantity: 1500,
    quantityUnit: 'KG',
    harvestDate: '2026-08-10',
    harvestLocationDistrict: 'Dindigul',
    harvestLocationState: 'Tamil Nadu',
  })
);
req.end();
