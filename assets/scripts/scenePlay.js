var scenePlay = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function () {
    Phaser.Scene.call(this, { key: "scenePlay" });
  },

  preload: function () {
    // Tilemaps
    this.load.tilemapTiledJSON("map1", "assets/maps/map1.tmj"); // only map1 used
    this.load.image("world_tiles", "assets/maps/world_tileset.png");
    this.load.spritesheet("knight", "assets/images/knight.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("coin", "assets/images/coin.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet("slime_green", "assets/images/slime_green.png", {
      frameWidth: 24,
      frameHeight: 24,
    });
  },

  create: function () {
    // 🧱 MAP
    const map = this.make.tilemap({ key: "map1" });
    const tileset = map.addTilesetImage("world_tileset", "world_tiles");

    // Memanggil semua layer yang ada di map.json

    const layer1 = map.createLayer("Tile Layer 1", tileset, 0, 0);
    const layer2 = map.createLayer("Tile Layer 2", tileset, 0, 0);
    const layer3 = map.createLayer("Tile Layer 3", tileset, 0, 0);

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
    const spawnCoin = (x, y) => {
      let coin = this.coins.create(x, y, "coin");
      coin.play("coin_spin");
      coin.body.allowGravity = false;
    };

    // GANTI ANGKA X DAN Y DI BAWAH INI UNTUK MENGUBAH POSISI KOIN
    spawnCoin(150, 150);
    spawnCoin(300, 150);
    spawnCoin(450, 150);
    spawnCoin(600, 150);

    this.player = this.physics.add.sprite(100, 100, "knight");
    this.player.setScale(1);
    this.player.isDead = false; // Tambahkan properti untuk cek status mati player

    // Memperkecil kotak fisika (hitbox) agar tidak mengambang di atas tanah
    // setSize(lebar, tinggi) mengatur ukuran kotak
    // setOffset(geser_X, geser_Y) menggeser kotak ke arah bawah agar pas dengan gambar
    this.player.body.setSize(14, 18);
    this.player.body.setOffset(9, 10);

    this.player.play("idle");

    // Menambahkan collision (tabrakan) antara player dengan layer 2 (tanah)
    layer2.setCollisionByExclusion([-1]);
    this.physics.add.collider(this.player, layer2);

    // Scaling otomatis sekarang ditangani oleh index.html (FIT)

    // Deteksi jika player dan koin saling tumpang tindih (overlap), maka panggil fungsi collectCoin
    this.physics.add.overlap(
      this.player,
      this.coins,
      this.collectCoin,
      null,
      this,
    );

    // SPAWN MUSUH SECARA MANUAL
    this.enemies = this.add.group();
    
    // GANTI ANGKA X DAN Y DI BAWAH INI UNTUK MENGUBAH POSISI
    // format: new Enemy(this, posisi_X, posisi_Y, jarak_patroli_blok)
    this.enemies.add(new Enemy(this, 250, 150, 2)); // Musuh 1
    this.enemies.add(new Enemy(this, 400, 150, 5)); // Musuh 2
    this.enemies.add(new Enemy(this, 600, 150, 1)); // Musuh 3
    
    if (typeof layer2 !== 'undefined' && layer2) {
      this.physics.add.collider(this.enemies, layer2);
    }

    // 4. Tabrakan player dengan SEMUA musuh di grup
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      // Jika player sedang jatuh ke bawah (velocity y > 0) dan posisi kakinya berada di atas musuh
      if (player.body.velocity.y > 0 && player.body.bottom < enemy.body.y + 20) {
        enemy.die(); // Panggil fungsi mati di musuh yang bersangkutan
        player.setVelocityY(-250); // Buat player memantul ke atas
      } else {
        // Jika terkena dari samping atau bawah, player yang mati
        if (!player.isDead) {
          player.isDead = true;
          player.setVelocity(0, 0); // Hentikan gerakan player
          player.body.enable = false; // Matikan fisika player
          player.play("death", true); // Mainkan animasi mati knight
          
          this.physics.pause(); 
          
          this.time.delayedCall(1000, () => {
            this.scene.restart();
          });
        }
      }
    });

    // Setup input keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Tambahkan kontrol WASD
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');

    // Status dash
    this.isDashing = false;
  },

  update: function () {
    // Update SEMUA musuh yang ada di dalam grup
    this.enemies.getChildren().forEach(enemy => {
      enemy.update();
    });

    // Jika sedang dash, atau player mati, abaikan input gerak biasa
    if (this.isDashing || this.player.isDead) {
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

    // Gerak kiri (Panah kiri ATAU tombol A)
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-125); // Lari diperlambat
      this.player.play("run", true);
      this.player.setFlipX(true);
    // Gerak kanan (Panah kanan ATAU tombol D)
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(125); // Lari diperlambat
      this.player.play("run", true);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.play("idle", true);
    }

    // Logika lompat (Panah atas ATAU tombol W)
    if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.blocked.down) {
      this.player.setVelocityY(-250); // Kecepatan lompat diperlambat
    }

    // Pindah ke scenePlay2 (map selanjutnya) jika player berjalan melebihi batas kanan layar (672px)
    if (this.player.x > 672) {
      this.scene.start("scenePlay2");
    }
  },

  // Fungsi yang dipanggil saat player menyentuh koin
  collectCoin: function (player, coin) {
    // Menghilangkan koin dari layar dan menonaktifkan fisiknya (diambil)
    coin.disableBody(true, true);
  },
});
