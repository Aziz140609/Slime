var scenePlay8 = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function () {
    Phaser.Scene.call(this, { key: "scenePlay8" });
  },

  preload: function () {
    this.load.tilemapTiledJSON("map8", "assets/maps/map8.tmj");
    this.load.image("world_tiles", "assets/maps/world_tileset.png");
    this.load.spritesheet("knight", "assets/images/knight.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    // Boss Assets
    this.load.spritesheet("boss_walk", "assets/images/BOSS/dark_knight_walk-Sheet.png", { frameWidth: 48, frameHeight: 32 });
    this.load.image("boss_idle", "assets/images/BOSS/dark_knight_idle.png");
    this.load.spritesheet("boss_attack", "assets/images/BOSS/dark_knight_attack1-Sheet.png", { frameWidth: 80, frameHeight: 32 });

    this.load.audio("music", "assets/audio/music/time_for_adventure.mp3");
    this.load.audio("jump", "assets/audio/sounds/jump.wav");
    this.load.audio("coin", "assets/audio/sounds/coin.wav");
  },

  create: function () {
    // 🧱 MAP
    const map = this.make.tilemap({ key: "map8" });
    const tileset = map.addTilesetImage("world_tileset", "world_tiles");

    //Sound
    this.bgMusic = this.sound.add("music", {
      loop: true,
      volume: 0.5,
    });
    this.jumpSound = this.sound.add("jump");
    this.coinSound = this.sound.add("coin");
    this.bgMusic.play();

    const layer1 = map.createLayer("Tile Layer 1", tileset, 0, 0);
    const layer2 = map.createLayer("Tile Layer 2", tileset, 0, 0);
    const layer3 = map.createLayer("Tile Layer 3", tileset, 0, 0);

    // Animasi Player
    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("knight", { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("knight", { start: 17, end: 31 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "death",
      frames: this.anims.generateFrameNumbers("knight", { start: 57, end: 59 }),
      frameRate: 6,
      repeat: 0,
    });
    this.anims.create({
      key: "roll",
      frames: this.anims.generateFrameNumbers("knight", { start: 40, end: 48 }),
      frameRate: 12,
      repeat: 0,
    });

    // Animasi Boss
    this.anims.create({
      key: "boss_walk_anim",
      frames: this.anims.generateFrameNumbers("boss_walk", { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "boss_attack_anim",
      frames: this.anims.generateFrameNumbers("boss_attack", { start: 0, end: 6 }),
      frameRate: 10,
      repeat: 0,
    });

    // PLAYER Setup
    
    let spawnX = 50;
    let spawnY = 150;
    let playerSpawn = this.registry.get('playerSpawn');
    if (playerSpawn && playerSpawn.targetScene === this.scene.key) {
      spawnX = playerSpawn.x;
      spawnY = playerSpawn.y;
    }
    this.player = this.physics.add.sprite(spawnX, spawnY, "knight");
    this.player.body.setSize(14, 18);
    this.player.body.setOffset(9, 10);
    this.player.play("idle");
    this.player.setCollideWorldBounds(true);

    if (layer2) {
      layer2.setCollisionByExclusion([-1]);
      this.physics.add.collider(this.player, layer2);
    }
    
    // Hapus jebakan layer3 karena mungkin menimpa tempat spawn player di map 8
    // Jika player jatuh ke bawah layar, akan otomatis mati di fungsi update()

    // BOSS Setup
    this.boss = this.physics.add.sprite(500, 150, "boss_walk");
    this.boss.setScale(1); // Ukuran dikembalikan normal agar mudah dihindari
    this.boss.body.setSize(16, 28);
    this.boss.body.setOffset(16, 4);
    this.boss.play("boss_walk_anim");
    this.boss.setBounce(0.2);
    this.boss.setCollideWorldBounds(true);

    if (layer2) {
      this.physics.add.collider(this.boss, layer2);
    }

    // Collision Boss dan Player (Bisa pakai collider atau overlap, overlap lebih responsif)
    this.physics.add.overlap(this.player, this.boss, (player, boss) => {
      this.killPlayer();
    });

    // GAME STATE
    this.gameState = "INTRO"; 
    this.timeLeft = 60; // 60 detik bertahan hidup
    this.isDead = false;
    this.bossIsDead = false;

    // UI Texts
    this.introText = this.add.text(336, 160, 'CARA MENANG:\n\nBertahan hidup selama 1 menit!\n\n(Game dimulai dalam 3 detik...)', {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '12px',
      fill: '#ffffff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5).setDepth(200).setShadow(2, 2, '#000000', 0, false, true);

    this.timerText = this.add.text(336, 30, 'Waktu: 60', {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '16px',
      fill: '#e74c3c'
    }).setOrigin(0.5).setDepth(200).setShadow(2, 2, '#000000', 0, false, true);
    this.timerText.setVisible(false);

    this.winText = this.add.text(336, 160, 'KAMU MENANG!\n\nBoss telah mati kehabisan darah!', {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '16px',
      fill: '#f1c40f',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5).setDepth(200).setShadow(2, 2, '#000000', 0, false, true);
    this.winText.setVisible(false);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');

    // Intro Timer (Tunggu 3 detik sebelum mulai gameplay)
    this.time.delayedCall(3000, () => {
      this.introText.setVisible(false);
      this.timerText.setVisible(true);
      this.gameState = "PLAYING";

      // Countdown Timer 1 menit
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (this.gameState === "PLAYING" && !this.isDead) {
            this.timeLeft--;
            this.timerText.setText('Waktu: ' + this.timeLeft);
            
            // Efek visual Boss berkedip merah (menandakan dia sedang sekarat)
            this.boss.setTint(0xff5555);
            this.time.delayedCall(200, () => {
              if (!this.bossIsDead && !this.boss.isAttacking) this.boss.clearTint();
            });

            // Menang ketika waktu habis
            if (this.timeLeft <= 0) {
              this.winGame();
            }
          }
        },
        callbackScope: this,
        loop: true
      });
    });
  },

  killPlayer: function() {
    if (!this.bossIsDead && !this.isDead && this.gameState === "PLAYING") {
      this.isDead = true;
      this.player.setVelocity(0, 0); 
      this.player.body.enable = false; 
      this.player.play("death", true); 
      
      // Munculkan teks kalah sementara
      let loseText = this.add.text(336, 160, 'KAMU TEWAS!', {
        fontFamily: '"Press Start 2P", Courier, monospace',
        fontSize: '16px',
        fill: '#ff0000',
        align: 'center'
      }).setOrigin(0.5).setDepth(200).setShadow(2, 2, '#000000', 0, false, true);

      this.time.delayedCall(2000, () => {
        this.scene.restart(); // Restart map 8
      });
    }
  },

  winGame: function() {
    this.gameState = "WIN";
    this.bossIsDead = true;
    this.boss.setVelocity(0, 0);
    this.boss.setTexture("boss_idle"); 
    this.boss.setTint(0xff0000); // Boss berubah merah penuh
    
    // Boss jatuh mati (animasi sederhana karena kita nggak pakai sprite defeated yang rumit)
    this.tweens.add({
      targets: this.boss,
      alpha: 0,
      y: this.boss.y + 20,
      rotation: 1.5,
      duration: 3000,
      onComplete: () => {
        this.boss.destroy();
      }
    });

    this.winText.setVisible(true);

    // Pindah kembali ke menu utama setelah 6 detik
    this.time.delayedCall(6000, () => {
      this.scene.start("sceneMenu");
    });
  },

  update: function () {
    // Kunci pergerakan jika belum main atau sudah selesai/mati
    if (this.gameState === "INTRO" || this.gameState === "WIN" || this.isDead) {
      this.player.setVelocityX(0);
      if (this.player.body.blocked.down && !this.isDead) {
        this.player.play("idle", true);
      }
      if (this.boss && this.boss.body && !this.bossIsDead) {
        this.boss.setVelocityX(0);
      }
      return;
    }

    // --- PLAYER MOVEMENT ---
    if (this.isDashing) return;

    // Logika Dash (Tekan Shift)
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.shift) &&
      this.player.body.blocked.down
    ) {
      this.isDashing = true;
      this.player.play("roll", true); 

      const dashSpeed = 200; 

      if (this.player.flipX) {
        this.player.setVelocityX(-dashSpeed);
      } else {
        this.player.setVelocityX(dashSpeed);
      }

      this.time.delayedCall(400, () => {
        this.isDashing = false;
      });

      return; 
    }

    let speed = 125;
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
      this.player.play("run", true);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
      this.player.play("run", true);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.play("idle", true);
    }

    if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.blocked.down) {
      this.player.setVelocityY(-300);
      this.jumpSound.play();
    }

    // Mati jika jatuh dari map
    if (this.player.y > 320) {
      this.killPlayer();
    }

    // --- BOSS AI ---
    if (!this.bossIsDead && this.boss && this.boss.body) {
      // Dinamis center hitbox agar tidak bergeser walau ukuran frame berubah saat ganti animasi
      this.boss.body.setOffset((this.boss.width - 16) / 2, 4);

      const dist = this.player.x - this.boss.x;
      const moveSpeed = 60; // Diperlambat sedikit agar player bisa bernapas

      // --- LOGIKA ANIMASI BOSS ---
      if (this.boss.isAttacking) {
        this.boss.play("boss_attack_anim", true);
      } else if (this.boss.isExhausted) {
        this.boss.stop();
        this.boss.setTexture("boss_idle");
      } else if (this.boss.body.velocity.x !== 0) {
        this.boss.play("boss_walk_anim", true);
      } else {
        this.boss.stop();
        this.boss.setTexture("boss_idle");
      }

      // Logika kejar player (Hanya jika tidak sedang menyerang & tidak sedang kelelahan)
      if (!this.boss.isAttacking && !this.boss.isExhausted) {
        if (Math.abs(dist) > 20) {
          if (dist > 0) {
            this.boss.setVelocityX(moveSpeed);
            this.boss.setFlipX(false);
          } else {
            this.boss.setVelocityX(-moveSpeed);
            this.boss.setFlipX(true);
          }
        } else {
          this.boss.setVelocityX(0);
        }
      } else if (this.boss.isExhausted) {
        // Boss diam saat kelelahan
        this.boss.setVelocityX(0);
      }
      
      // Boss otomatis melompat jika nyangkut tembok
      if (this.boss.body.blocked.left || this.boss.body.blocked.right) {
        if (this.boss.body.blocked.down && !this.boss.isExhausted) {
           this.boss.setVelocityY(-250);
        }
      }

      // Attack Pattern: Dash Strike
      if (!this.boss.attackTimer) {
        this.boss.attackTimer = this.time.addEvent({
          delay: 5000, // Menyerang tiap 5 detik (ada jeda lebih lama)
          callback: () => {
            if (this.bossIsDead || this.gameState !== "PLAYING") return;
            
            // Persiapan menyerang (berhenti sejenak, nyala kuning)
            this.boss.isAttacking = true;
            this.boss.setVelocityX(0);
            this.boss.setTint(0xffaa00); 
            
            // Memberi waktu 1 detik penuh bagi player untuk sadar & bersiap menghindar!
            this.time.delayedCall(1000, () => {
              if (this.bossIsDead) return;
              this.boss.clearTint();
              
              // Melompat sedikit dan dash ke arah hadapannya
              let dashPower = 250; // Kekuatan dash sedikit dikurangi
              this.boss.setVelocityX(this.boss.flipX ? -dashPower : dashPower);
              this.boss.setVelocityY(-150); 
              
              // Selesai dash setelah 0.8 detik
              this.time.delayedCall(800, () => {
                if (!this.bossIsDead) {
                   this.boss.isAttacking = false;
                   this.boss.isExhausted = true; // Boss lelah setelah nge-dash
                   this.boss.setTint(0xa0a0a0); // Warna sedikit gelap (lelah)
                   
                   // Lelah selama 1.5 detik (momen paling aman untuk player melompati boss)
                   this.time.delayedCall(1500, () => {
                     if (!this.bossIsDead) {
                       this.boss.isExhausted = false;
                       this.boss.clearTint();
                     }
                   });
                }
              });
            });
          },
          loop: true
        });
      }
    }
  }
});
