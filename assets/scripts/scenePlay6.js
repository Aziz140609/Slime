var scenePlay6 = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function () {
    Phaser.Scene.call(this, { key: "scenePlay6" });
  },

  preload: function () {
    this.load.tilemapTiledJSON("map6", "assets/maps/map6.tmj"); // load map6
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
    const map = this.make.tilemap({ key: "map6" });
    const tileset = map.addTilesetImage("world_tileset", "world_tiles");

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

    this.player = this.physics.add.sprite(10, 175, "knight");

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

    // Menambahkan efek memantul (trampolin) jika menyentuh layer 4
    if (layer4) {
      layer4.setCollisionByExclusion([-1]);
      this.physics.add.collider(this.player, layer4, (player, tile) => {
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
        this.isDead = true; // Tandai player sudah mati

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
    
    // GANTI ANGKA X DAN Y DI BAWAH INI UNTUK MENGUBAH POSISI
    // format: new Enemy(this, posisi_X, posisi_Y, jarak_patroli_blok)
    this.enemies.add(new Enemy(this, 250, 150, 2)); // Musuh 1
    this.enemies.add(new Enemy(this, 400, 150, 3)); // Musuh 2
    this.enemies.add(new Enemy(this, 550, 150, 2)); // Musuh 3
    
    if (typeof layer2 !== 'undefined' && layer2) {
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

    // Jika sedang dash, abaikan input gerak biasa
    if (this.isDashing) {
      return;
    }

    // DASH
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

    // GERAK
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-100);
      this.player.play("run", true);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(100);
      this.player.play("run", true);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.play("idle", true);
    }

    // LOMPAT
    if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.blocked.down) {
      this.player.setVelocityY(-250);
    }

    // PINDAH SCENE
    if (this.player.x > 672) {
      this.scene.start("scenePlay7");
    }
  },

  collectCoin: function (player, coin) {
    coin.disableBody(true, true);
  },
});
