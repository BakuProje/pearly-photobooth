const sharp = require('sharp');
const fs = require('fs');

async function checkT16() {
  const meta = await sharp('images/template/template 16.png').metadata();
  console.log('T16 meta:', meta);
}
checkT16();
