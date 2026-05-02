const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../assets/scripts');

for (let i = 1; i <= 7; i++) {
  const fileName = i === 1 ? 'scenePlay.js' : `scenePlay${i}.js`;
  const filePath = path.join(scriptsDir, fileName);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace default font with pixel art font
  content = content.replace(
    /this\.scoreText = this\.add\.text\(16, 16, 'Coin: ' \+ window\.gameScore, \{\s*fontSize: '24px',\s*fill: '#fff',\s*fontStyle: 'bold',\s*stroke: '#000',\s*strokeThickness: 4\s*\}\)/,
    `this.scoreText = this.add.text(16, 16, 'Coin: ' + window.gameScore, {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '16px', 
      fill: '#f1c40f',
      stroke: '#000',
      strokeThickness: 4
    })`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched font in ' + filePath);
}
