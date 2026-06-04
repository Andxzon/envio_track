const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.json', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const rawData = JSON.parse(data);
    const citiesList = [];

    rawData.forEach(dept => {
      dept.ciudades.forEach(city => {
        citiesList.push({
          city: city,
          department: dept.departamento
        });
      });
    });

    // Ordenar alfabéticamente
    citiesList.sort((a, b) => a.city.localeCompare(b.city));

    const outputPath = './src/lib/data/colombia-cities.json';
    fs.mkdirSync('./src/lib/data', { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(citiesList));
    
    console.log(`Guardadas ${citiesList.length} ciudades en ${outputPath}`);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
