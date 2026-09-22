const http = require('http');

const token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4NzFjYjgyMi1mOTVlLTQ2YzUtYTQyNC1hZjZhMmFiZjEwZWIiLCJyb2xlcyI6WyJGQVJNRVIiXSwiaWF0IjoxNzg2NDMwMDYzLCJleHAiOjE3ODY1MTY0NjN9.E8M8V_6FSmrijnwmI-57EZAPW7FrnEfVpY92FNOSeQ2c9COMIyqaJ0f7NcLG8JEM6W8reprAIuwaKioo8s77ig';

const req = http.request(
  'http://localhost:8085/api/v1/batches/394/listing',
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
    res.on('end', () => console.log('LISTING RESP:', res.statusCode, d));
  }
);

req.write(
  JSON.stringify({
    askingPricePerUnit: 26.0,
    minimumOrderQuantity: 100,
  })
);
req.end();
