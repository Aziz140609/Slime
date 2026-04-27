var sceneMenu = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function () {
        Phaser.Scene.call(this, { key: 'sceneMenu' });
    },
    preload: function () {
        this.load.image('bg_start', 'assets/images/bg_start.png');
        this.load.image('play', 'assets/images/play.png');
        this.load.image('slime', 'assets/images/slime.png');
    },
    create: function () {
        const { width, height } = this.scale;
        
        // Tambahkan background dan atur agar menutupi satu layar (full tanpa kepotong)
        let bg = this.add.image(width / 2, height / 2, 'bg_start');
        
        // Paksa ukuran background mengikuti ukuran layar (stretch)
        bg.setDisplaySize(width, height).setScrollFactor(0);


        let play = this.add.image(width / 2, height / 2 + 150, 'play').setScale(0.5).setInteractive();
        let slime = this.add.image(width / 2, height / 2 - 150, 'slime').setScale(0.5);

        // Animasi kenyel-kenyel untuk slime (Judul/Karakter)
        this.tweens.add({
            targets: slime,
            scaleX: 0.55,
            scaleY: 0.45,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Animasi denyut/kenyel untuk tombol Play
        this.tweens.add({
            targets: play,
            scaleX: 0.55,
            scaleY: 0.55,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

         this.input.on('gameobjectup', (pointer, gameObject) => {
            if (gameObject === play) {
                play.clearTint();
                this.scene.start('scenePlay');
            }
        });

    }
});

