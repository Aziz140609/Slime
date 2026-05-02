const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../assets/scripts');

const manualBlock = `    // SPAWN MUSUH SECARA MANUAL
    this.enemies = this.add.group();
    
    // GANTI ANGKA X DAN Y DI BAWAH INI UNTUK MENGUBAH POSISI
    // format: new Enemy(this, posisi_X, posisi_Y, jarak_patroli_blok)
    this.enemies.add(new Enemy(this, 250, 150, 2)); // Musuh 1
    this.enemies.add(new Enemy(this, 400, 150, 3)); // Musuh 2
    this.enemies.add(new Enemy(this, 550, 150, 2)); // Musuh 3
    
    if (typeof layer2 !== 'undefined' && layer2) {
      this.physics.add.collider(this.enemies, layer2);
    }`;

for (let i = 1; i <= 7; i++) {
  const fileName = i === 1 ? 'scenePlay.js' : `scenePlay${i}.js`;
  const filePath = path.join(scriptsDir, fileName);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace automatic spawn block with manual spawn block
  content = content.replace(
    /\s*\/\/\s*SPAWN MUSUH SECARA OTOMATIS[\s\S]*?this\.physics\.add\.collider\(this\.enemies, layer2\);\n\s*\}/,
    '\n' + manualBlock
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched manual ' + filePath);
}
