const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../assets/scripts');

const scoreUIBlock = `
    // UI Skor Koin
    window.gameScore = window.gameScore || 0;
    this.scoreText = this.add.text(16, 16, 'Coin: ' + window.gameScore, {
      fontSize: '24px', 
      fill: '#fff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);`;

const collectCoinBlock = `collectCoin: function (player, coin) {
    // Menghilangkan koin dari layar dan menonaktifkan fisiknya (diambil)
    coin.disableBody(true, true);
    
    // Tambah skor koin
    window.gameScore += 1;
    this.scoreText.setText('Coin: ' + window.gameScore);
  }`;

for (let i = 1; i <= 7; i++) {
  const fileName = i === 1 ? 'scenePlay.js' : `scenePlay${i}.js`;
  const filePath = path.join(scriptsDir, fileName);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Inject UI score right before this.cursors = ...
  if (!content.includes('this.scoreText = this.add.text')) {
    content = content.replace(
      /this\.cursors = this\.input\.keyboard\.createCursorKeys\(\);/,
      scoreUIBlock + '\n    this.cursors = this.input.keyboard.createCursorKeys();'
    );
  }

  // Inject collectCoin logic
  if (!content.includes('window.gameScore += 1;')) {
    content = content.replace(
      /collectCoin: function \(player, coin\) \{[\s\S]*?coin\.disableBody\(true, true\);\s*\}/,
      collectCoinBlock
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched score in ' + filePath);
}
