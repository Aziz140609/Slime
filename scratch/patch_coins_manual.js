const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../assets/scripts');

const manualCoinBlock = `    // SPAWN COIN SECARA MANUAL
    this.coins = this.physics.add.group();
    
    // Fungsi bantuan untuk menaruh koin
    const spawnCoin = (x, y) => {
      let coin = this.coins.create(x, y, "coin");
      coin.play("coin_spin");
      coin.body.allowGravity = false;
    };

    // GANTI ANGKA X DAN Y DI BAWAH INI UNTUK MENGUBAH POSISI KOIN
    spawnCoin(150, 150);
    spawnCoin(300, 150);
    spawnCoin(450, 150);
    spawnCoin(600, 150);`;

for (let i = 1; i <= 7; i++) {
  const fileName = i === 1 ? 'scenePlay.js' : `scenePlay${i}.js`;
  const filePath = path.join(scriptsDir, fileName);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace automatic coin spawn block with manual spawn block
  content = content.replace(
    /this\.coins = this\.physics\.add\.group\(\);\s*const coinSpawnLayers =.*?coin\.body\.allowGravity = false; \/\/ biar gak jatuh\s*\}\);/s,
    manualCoinBlock
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched manual coins in ' + filePath);
}
