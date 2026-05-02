const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../assets/scripts');

for (let i = 2; i <= 7; i++) {
  const filePath = path.join(scriptsDir, `scenePlay${i}.js`);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Inject slime_green preload
  if (!content.includes('slime_green.png')) {
    content = content.replace(
      /this\.load\.spritesheet\("coin".*?\n.*?\n.*?\n.*?\};/s,
      match => match + '\n    this.load.spritesheet("slime_green", "assets/images/slime_green.png", {\n      frameWidth: 24,\n      frameHeight: 24,\n    });'
    );
  }

  // 2. Inject enemies create logic
  if (!content.includes('this.enemies = this.add.group();')) {
    const enemiesCreateLogic = `
    // SPAWN MUSUH SECARA OTOMATIS (MAX 3)
    this.enemies = this.add.group();
    if (typeof layer2 !== 'undefined' && layer2) {
      let spawned = 0;
      for (let x = 200; x < map.widthInPixels - 50 && spawned < 3; x += 150) {
        for (let y = map.heightInPixels; y > 0; y -= 16) {
          if (layer2.hasTileAtWorldXY(x, y)) {
            if (!layer2.hasTileAtWorldXY(x, y - 16) && !layer2.hasTileAtWorldXY(x, y - 32)) {
              this.enemies.add(new Enemy(this, x, y - 32, 2)); 
              spawned++;
              break;
            }
          }
        }
      }
      this.physics.add.collider(this.enemies, layer2);
    }

    // Tabrakan player dengan SEMUA musuh di grup
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (player.body.velocity.y > 0 && player.body.bottom < enemy.body.y + 20) {
        enemy.die(); 
        player.setVelocityY(-250); 
      } else {
        if (!player.isDead) {
          player.isDead = true;
          player.setVelocity(0, 0); 
          player.body.enable = false; 
          player.play("death", true); 
          
          this.physics.pause(); 
          this.time.delayedCall(1000, () => {
            this.scene.restart();
          });
        }
      }
    });
`;
    // Insert before "this.cursors = "
    content = content.replace(
      /this\.cursors = this\.input\.keyboard\.createCursorKeys\(\);/,
      enemiesCreateLogic + '\n    this.cursors = this.input.keyboard.createCursorKeys();'
    );
  }

  // 3. Inject enemies update logic
  if (!content.includes('this.enemies.getChildren().forEach')) {
    content = content.replace(
      /update: function \(\) \{/,
      `update: function () {\n    if (this.enemies) {\n      this.enemies.getChildren().forEach(enemy => {\n        enemy.update();\n      });\n    }\n`
    );
  }

  // 4. Inject WASD creation
  if (!content.includes('this.wasd = ')) {
    content = content.replace(
      /this\.cursors = this\.input\.keyboard\.createCursorKeys\(\);/,
      `this.cursors = this.input.keyboard.createCursorKeys();\n    this.wasd = this.input.keyboard.addKeys('W,S,A,D');`
    );
  }

  // 5. Inject WASD update logic
  content = content.replace(/if \(this\.cursors\.left\.isDown\) \{/, 'if (this.cursors.left.isDown || this.wasd.A.isDown) {');
  content = content.replace(/\} else if \(this\.cursors\.right\.isDown\) \{/, '} else if (this.cursors.right.isDown || this.wasd.D.isDown) {');
  content = content.replace(/if \(this\.cursors\.up\.isDown && this\.player\.body\.blocked\.down\) \{/, 'if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.blocked.down) {');

  // Fix player isDead initialization
  if (!content.includes('this.player.isDead = false;')) {
    content = content.replace(
      /this\.player = this\.physics\.add\.sprite\(.*?,\n.*?this\.player\.body\.setSize/,
      match => match.replace('this.player.body.setSize', 'this.player.isDead = false;\n    this.player.body.setSize')
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched ' + filePath);
}
