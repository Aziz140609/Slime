const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../assets/scripts');

for (let i = 1; i <= 7; i++) {
  const fileName = i === 1 ? 'scenePlay.js' : `scenePlay${i}.js`;
  const filePath = path.join(scriptsDir, fileName);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Inject score reset on death
  content = content.replace(
    /this\.isDead = true;/g,
    'this.isDead = true;\n        window.gameScore = 0;'
  );
  
  content = content.replace(
    /player\.isDead = true;/g,
    'player.isDead = true;\n          window.gameScore = 0;'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched score reset in ' + filePath);
}
