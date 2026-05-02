class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, posX, posY, walkDistance) {
        // Panggil constructor induk (Sprite) dengan gambar 'slime_green'
        super(scene, posX, posY, 'slime_green');
        
        // Tambahkan musuh ke scene dan aktifkan fisika
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Pengaturan fisika dasar
        this.setCollideWorldBounds(true);
        this.setBounce(0.2);

        // Pengaturan logika berjalan
        // Asumsi 1 unit = 32 pixel (sesuaikan dengan ukuran tile kamu, biasanya 16 atau 32)
        this.tileSize = 32; 
        this.walkLimit = walkDistance * this.tileSize; 
        
        this.startX = posX; // Menyimpan posisi awal spawn
        this.direction = 1; // 1 = bergerak ke kanan, -1 = bergerak ke kiri
        this.speed = 40;    // Kecepatan musuh (bisa kamu ubah)
        this.isHit = false; // Status apakah sedang terkena serangan
        this.isDead = false; // Status apakah musuh sudah mati
        
        // Inisialisasi animasi
        this.createAnimations(scene);
        
        // Memulai dengan animasi bangkit (spawn)
        this.play('slime_bangkit', true);
        
        // Setelah animasi bangkit selesai, mulai berjalan
        this.once('animationcomplete-slime_bangkit', () => {
            this.play('slime_berjalan', true);
            this.setVelocityX(this.speed * this.direction);
        });
    }

    createAnimations(scene) {
        // Membuat animasi bangkit
        if (!scene.anims.exists('slime_bangkit')) {
            scene.anims.create({
                key: 'slime_bangkit',
                // PERHATIAN: Ganti angka start dan end sesuai urutan frame di spritesheet slime_green kamu
                frames: scene.anims.generateFrameNumbers('slime_green', { start: 0, end: 3 }), 
                frameRate: 8,
                repeat: 0 // Berjalan hanya sekali
            });
        }
        
        // Membuat animasi berjalan
        if (!scene.anims.exists('slime_berjalan')) {
            scene.anims.create({
                key: 'slime_berjalan',
                // PERHATIAN: Ganti angka start dan end sesuai urutan frame
                frames: scene.anims.generateFrameNumbers('slime_green', { start: 4, end: 7 }),
                frameRate: 10,
                repeat: -1 // Loop terus menerus
            });
        }

        // Membuat animasi terkena hit
        if (!scene.anims.exists('slime_hit')) {
            scene.anims.create({
                key: 'slime_hit',
                // PERHATIAN: Ganti angka start dan end sesuai urutan frame
                frames: scene.anims.generateFrameNumbers('slime_green', { start: 8, end: 10 }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Membuat animasi mati (kebalikan dari bangkit)
        if (!scene.anims.exists('slime_mati')) {
            scene.anims.create({
                key: 'slime_mati',
                // Dari frame 4 ke 0 sesuai permintaanmu
                frames: scene.anims.generateFrameNumbers('slime_green', { start: 4, end: 0 }),
                frameRate: 10,
                repeat: 0
            });
        }
    }

    update() {
        // Jika sedang mati/hit atau belum selesai bangkit, jangan jalankan logika bergerak
        if (this.isHit || this.isDead || this.anims.currentAnim?.key === 'slime_bangkit') return;

        // Logika patroli (bolak-balik)
        // 1. Balik arah jika menabrak tembok (layer2)
        if (this.body.blocked.right && this.direction === 1) {
            this.direction = -1;
            this.startX = this.x - this.walkLimit; // Supaya dia bisa jalan ke kiri penuh
        } else if (this.body.blocked.left && this.direction === -1) {
            this.direction = 1;
            this.startX = this.x; // Supaya dia bisa jalan ke kanan penuh
        }
        
        // 2. Balik arah jika mencapai batas jarak yang ditentukan
        if (this.x >= this.startX + this.walkLimit && this.direction === 1) {
            this.direction = -1;
            this.startX = this.x - this.walkLimit; 
        } else if (this.x <= this.startX && this.direction === -1) {
            this.direction = 1;
            this.startX = this.x;
        }

        // Terapkan arah dan kecepatan
        this.flipX = (this.direction === -1); // Balik sprite menghadap kiri jika direction -1
        this.setVelocityX(this.speed * this.direction);
    }

    // Panggil fungsi ini dari scene ketika player menyerang musuh
    takeHit() {
        if (this.isHit || this.isDead) return; // Mencegah hit berkali-kali secara bersamaan

        this.isHit = true;
        this.setVelocityX(0); // Berhenti berjalan saat kena hit
        this.play('slime_hit', true);

        // Setelah animasi hit selesai, kembali berjalan
        this.once('animationcomplete-slime_hit', () => {
            if (!this.isDead) {
                this.isHit = false;
                this.play('slime_berjalan', true);
                this.setVelocityX(this.speed * this.direction);
            }
        });
    }

    // Fungsi mati jika diinjak
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setVelocity(0, 0); // Berhenti
        this.body.enable = false; // Matikan kotak fisik agar tidak bisa ditabrak lagi
        
        this.play('slime_mati', true);
        
        // Hapus slime dari game setelah animasi selesai
        this.once('animationcomplete-slime_mati', () => {
            this.destroy();
        });
    }
}
