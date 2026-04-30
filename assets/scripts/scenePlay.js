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

    this.coins = this.physics.add.group();

    const coinSpawnLayers = [layer2, layer3].filter(Boolean);
    const preferredColumns = [
      map.widthInPixels * 0.15,
      map.widthInPixels * 0.32,
      map.widthInPixels * 0.5,
      map.widthInPixels * 0.68,
      map.widthInPixels * 0.85,
    ];

    const coinPositions = preferredColumns.map((xPos) => {
      const x = Math.floor(xPos);
      const stepY = map.tileHeight || 16;

      for (let y = stepY; y < map.heightInPixels - stepY; y += stepY) {
        const overlapsLayer = coinSpawnLayers.some((layer) =>
          layer.hasTileAtWorldXY(x, y),
        );
        const hasFloorBelow = layer2
          ? layer2.hasTileAtWorldXY(x, y + stepY)
          : true;

        if (!overlapsLayer && hasFloorBelow) {
          return { x, y };
        }
      }

      return { x, y: stepY * 2 };
    });

    coinPositions.forEach((pos) => {
      let coin = this.coins.create(pos.x, pos.y, "coin");
      coin.play("coin_spin");
      coin.body.allowGravity = false; // biar gak jatuh
    });

    this.player = this.physics.add.sprite(100, 100, "knight");
    this.player.setScale(1);

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

    // Setup input keyboard
    this.cursors = this.input.keyboard.createCursorKeys();

    // Status dash
    this.isDashing = false;
  },

  update: function () {
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

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-125); // Lari diperlambat
      this.player.play("run", true);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(125); // Lari diperlambat
      this.player.play("run", true);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.play("idle", true);
    }

    // Logika lompat (hanya bisa lompat jika tombol atas ditekan & sedang menyentuh tanah)
    if (this.cursors.up.isDown && this.player.body.blocked.down) {
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
