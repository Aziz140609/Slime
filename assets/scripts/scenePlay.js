var scenePlay = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function () {
        Phaser.Scene.call(this, { key: 'scenePlay' });
    },
    preload: function () {
        this.load.image('bg_plays', 'assets/images/bg_plays.png');
        
        // Memuat Tilemap JSON dan Gambar Tileset
        this.load.tilemapTiledJSON('map_json', 'assets/maps/map.json');
        this.load.image('world_tiles', 'assets/images/world_tileset.png');
    },
    create: function () {
        const { width, height } = this.scale;
        
        // Background (taruh paling belakang)
        let bg = this.add.image(width / 2, height / 2, 'bg_plays');
        bg.setDisplaySize(width, height).setScrollFactor(0);
        bg.setDepth(-1);

        // 1. Membuat data Map dari JSON
        const map = this.make.tilemap({ key: 'map_json' });

        // 2. Menghubungkan gambar ke tileset
        const tileset = map.addTilesetImage('world_tileset', 'world_tiles');

        // 3. Membuat Layer
        const layer = map.createLayer('Tile Layer 1', tileset, 0, 0);
        
        if (layer) {
            console.log("Layer created successfully!");
            layer.setDepth(1);
            layer.setScale(2.5);
        } else {
            console.warn("Layer 'Tile Layer 1' not found!");
        }

        // Tambahkan instruksi
        this.add.text(20, 20, 'Scene Play: Menggunakan Tilemap Tiled (JSON)', { 
            fontSize: '18px', 
            fill: '#fff',
            backgroundColor: '#000'
        });
        
        this.add.text(width / 2, height - 50, 'Tekan ESC untuk Kembali', { fill: '#fff' }).setOrigin(0.5);

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('sceneMenu');
        });
    }
});
