var scenePlay4 = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { key: "scenePlay4" });
  },

  preload: function () {
    // Tilemaps
    this.load.tilemapTiledJSON("map4", "assets/maps/map4.tmj"); // load map4
    this.load.image("world_tiles", "assets/maps/world_tileset.png");
    this.load.spritesheet("knight", "assets/images/knight.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("coin", "assets/images/coin.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.audio("music", "assets/audio/music/time_for_adventure.mp3");
    this.load.audio("jump", "assets/audio/sounds/jump.wav");
    this.load.audio("coin", "assets/audio/sounds/coin.wav");
  },

  create: function () {
    // 🧱 MAP
    const map = this.make.tilemap({ key: "map4" });
    const tileset = map.addTilesetImage("world_tileset", "world_tiles");

    //Sound
    this.bgMusic = this.sound.add("music", {
      loop: true,
      volume: 0.5,
    });
    this.jumpSound = this.sound.add("jump");
    this.coinSound = this.sound.add("coin");
    this.bgMusic.play();

    // Memanggil semua layer yang ada di map.json

    const layer1 = map.createLayer("Tile Layer 1", tileset, 0, 0);
    const layer2 = map.createLayer("Tile Layer 2", tileset, 0, 0);
    const layer3 = map.createLayer("Tile Layer 3", tileset, 0, 0);
    const layer4 = map.createLayer("Tile Layer 4", tileset, 0, 0);
    const layer5 = map.createLayer("Tile Layer 5", tileset, 0, 0);

    this.anims.create({
      key: "coin_spin",
      frames: this.anims.generateFrameNumbers("coin", { start: 0, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });

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
      key: "roll",
      frames: this.anims.generateFrameNumbers("knight", { start: 40, end: 48 }),
      frameRate: 12,
      repeat: 0,
    });

    this.anims.create({
      key: "hit",
      frames: this.anims.generateFrameNumbers("knight", { start: 24, end: 31 }),
      frameRate: 8,
      repeat: 0,
    });

    this.anims.create({
      key: "death",
      frames: this.anims.generateFrameNumbers("knight", { start: 57, end: 59 }),
      frameRate: 6,
      repeat: 0,
    });

        // SPAWN COIN SECARA MANUAL
    this.coins = this.physics.add.group();
    
    // Fungsi bantuan untuk menaruh koin
    let collectedCoins = this.registry.get('collectedCoins') || {};
    const spawnCoin = (x, y) => {
      let coinId = this.scene.key + "_" + x + "_" + y;
      if (collectedCoins[coinId]) return;

      let coin = this.coins.create(x, y, "coin");
      coin.play("coin_spin");
      coin.body.allowGravity = false;
      coin.coinId = coinId;
    };

    // GANTI ANGKA X DAN Y DI BAWAH INI UNTUK MENGUBAH POSISI KOIN
    spawnCoin(150, 150);
    spawnCoin(300, 150);
    spawnCoin(450, 70);
    spawnCoin(600, 200);

    
    let spawnX = 10;
    let spawnY = 175;
    let playerSpawn = this.registry.get('playerSpawn');
    if (playerSpawn && playerSpawn.targetScene === this.scene.key) {
      spawnX = playerSpawn.x;
      spawnY = playerSpawn.y;
    }
    this.player = this.physics.add.sprite(spawnX, spawnY, "knight");

    // Memperkecil kotak fisika (hitbox) agar tidak mengambang di atas tanah
    // setSize(lebar, tinggi) mengatur ukuran kotak
    // setOffset(geser_X, geser_Y) menggeser kotak ke arah bawah agar pas dengan gambar
    this.player.body.setSize(14, 18);
    this.player.body.setOffset(9, 10);

    this.player.play("idle");

    // Menambahkan collision (tabrakan) antara player dengan layer 2 (tanah)
    if (layer2) {
      layer2.setCollisionByExclusion([-1]);
      this.physics.add.collider(this.player, layer2);
    }

    // Menambahkan efek memantul (trampolin) jika menyentuh layer 5
    if (layer5) {
      layer5.setCollisionByExclusion([-1]);
      this.physics.add.collider(this.player, layer5, (player, tile) => {
        // Memastikan player terpental hanya ketika menginjak dari atas
        if (player.body.blocked.down) {
          const bouncePower = -500; // UBAH ANGKA INI UNTUK MENGATUR TINGGI PANTULAN (semakin negatif = semakin tinggi)
          player.setVelocityY(bouncePower);
        }
      });
    }

    // --- JEBAKAN (Layer 3) ---
    if (layer3) {
      layer3.setCollisionByExclusion([-1]);
      this.physics.add.collider(this.player, layer3, () => {
        if (this.isDead) return; // Mencegah kode ini berjalan berulang-ulang
        this.isDead = true;
        window.gameScore = 0; this.registry.set('collectedCoins', {}); this.registry.set('killedEnemies', {}); // Tandai player sudah mati

        // Hentikan pergerakan
        this.player.setVelocity(0, 0);
        // Nonaktifkan physics agar tidak terkena efek gravitasi atau input saat mati
        this.player.body.enable = false;

        // Mainkan animasi mati
        this.player.play("death");

        // Setelah animasi 'death' selesai dimainkan, kembali ke scenePlay (map 1)
        this.player.once("animationcomplete-death", () => {
          this.scene.start("scenePlay");
        });
      });
    }

    // Scaling otomatis sekarang ditangani oleh index.html (FIT)

    // Deteksi jika player dan koin saling tumpang tindih (overlap), maka panggil fungsi collectCoin
    this.physics.add.overlap(
      this.player,
      this.coins,
      this.collectCoin,
      null,
      this,
    );

    // Setup input keyboard
    // SPAWN MUSUH SECARA MANUAL
    this.enemies = this.add.group();
    let killedEnemies = this.registry.get('killedEnemies') || {};
    const spawnEnemy = (x, y, range) => {
      let enemyId = this.scene.key + "_enemy_" + x + "_" + y;
      if (killedEnemies[enemyId]) return;
      let enemy = new Enemy(this, x, y, range);
      enemy.enemyId = enemyId;
      this.enemies.add(enemy);
    };
    
    // GANTI ANGKA X DAN Y DI BAWAH INI UNTUK MENGUBAH POSISI
    // format: new Enemy(this, posisi_X, posisi_Y, jarak_patroli_blok)
    spawnEnemy(150, 10, 2); // Musuh 1
    spawnEnemy(430, 10, 1); // Musuh 2
    spawnEnemy(500, 150, 1); // Musuh 3
    
    if (typeof layer2 !== 'undefined' && layer2) {
      this.physics.add.collider(this.enemies, layer2);
    }

    // Tabrakan player dengan SEMUA musuh di grup
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (player.body.velocity.y > 0 && player.body.bottom < enemy.body.y + 20) {
        // Injak dari atas: musuh mati, player mantul
        enemy.die();
          let killedEnemies = this.registry.get('killedEnemies') || {};
          if (enemy.enemyId) killedEnemies[enemy.enemyId] = true;
          this.registry.set('killedEnemies', killedEnemies); 
        player.setVelocityY(-250); 
      } else {
        // Kena dari depan/samping: player mati, kembali ke map 1
        if (!player.isDead) {
          player.isDead = true;
          this.isDead = true;
          window.gameScore = 0; this.registry.set('collectedCoins', {}); this.registry.set('killedEnemies', {});
          player.setVelocity(0, 0); 
          player.body.enable = false; 
          player.play("death", true); 

          player.once("animationcomplete-death", () => {
            this.scene.start("scenePlay");
          });
        }
      }
    });

    
    // UI Skor Koin
    window.gameScore = window.gameScore || 0;
    this.scoreText = this.add.text(16, 16, 'Coin: ' + window.gameScore, {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '16px', 
      fill: '#f1c40f',
      stroke: '#000',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');

    // Status gerakan & status hidup
    this.isDashing = false;
    this.isDead = false;
  },

  update: function () {
    if (this.enemies) {
      this.enemies.getChildren().forEach(enemy => {
        enemy.update();
      });
    }

    // Jika sudah mati, abaikan semua input agar animasi mati tidak tertimpa
    if (this.isDead) {
      return;
    }

    // Jika sedang dash, abaikan input gerak biasa agar kecepatan dan animasinya tidak terganggu
    if (this.isDashing) {
      return;
    }

    // Logika Dash (Tekan Shift)
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.shift) &&
      this.player.body.blocked.down
    ) {
      this.isDashing = true;
      this.player.play("roll", true); // Gunakan animasi roll

      const dashSpeed = 200; // Kecepatan lari dash diperlambat

      // Melesat ke arah karakter menghadap (kiri/kanan)
      if (this.player.flipX) {
        this.player.setVelocityX(-dashSpeed);
      } else {
        this.player.setVelocityX(dashSpeed);
      }

      // Timer: Dash akan berhenti setelah 400 milidetik (0.4 detik)
      this.time.delayedCall(400, () => {
        this.isDashing = false;
      });

      return; // Selesai untuk frame ini, jangan jalankan gerakan lain
    }

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-100); // Lari diperlambat
      this.player.play("run", true);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(100); // Lari diperlambat
      this.player.play("run", true);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.play("idle", true);
    }

    // Logika lompat (hanya bisa lompat jika tombol atas ditekan & sedang menyentuh tanah)
    if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.blocked.down) {
      this.player.setVelocityY(-250); // Kecepatan lompat diperlambat
      this.jumpSound.play();
    }

    // Pindah ke map selanjutnya jika player berjalan melebihi batas kanan layar
    if (this.player.x > 672) {
      this.registry.set('playerSpawn', { x: 20, y: this.player.y, targetScene: "scenePlay5" });
      this.registry.set('cameFrom_scenePlay5', this.scene.key);
      this.scene.start("scenePlay5");
    }

    if (this.scene.key !== "scenePlay" && this.player.x < 0) {
      let prev = this.registry.get('cameFrom_' + this.scene.key);
      if (prev) {
        this.registry.set('playerSpawn', { x: 650, y: this.player.y, targetScene: prev });
        this.scene.start(prev);
      }
    }
    
    if (this.scene.key === "scenePlay6" && this.player.y < 0) {
      let prev = this.registry.get('cameFrom_' + this.scene.key) || "scenePlay3";
      this.registry.set('playerSpawn', { x: this.player.x, y: 300, targetScene: prev });
      this.scene.start(prev);
    }
    
  },

  // Fungsi yang dipanggil saat player menyentuh koin
  collectCoin: function (player, coin) {
    coin.disableBody(true, true);
    this.coinSound.play();
    
    let collectedCoins = this.registry.get('collectedCoins') || {};
    collectedCoins[coin.coinId] = true;
    this.registry.set('collectedCoins', collectedCoins);

    window.gameScore += 1;
    this.scoreText.setText('Coin: ' + window.gameScore);
  },
});
