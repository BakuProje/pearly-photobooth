const fs = require('fs');
const path = require('path');

if (fs.existsSync('scratch')) {
  fs.readdirSync('scratch').forEach(f => {
    const fp = path.join('scratch', f);
    if (fs.statSync(fp).isFile() && (f.endsWith('.js') || f.endsWith('.ts'))) {
      let c = fs.readFileSync(fp, 'utf8');
      if (c.includes('public/images/')) {
        c = c.replace(/(['"`])images\//g, '$1public/images/');
        fs.writeFileSync(fp, c, 'utf8');
        console.log('Updated:', f);
      }
    }
  });
}
console.log('Done updating scratch files.');
