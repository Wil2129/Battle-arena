import * as $ from "jquery";
import Phaser from "phaser";
import Game from './game/game.js';

(function () {
    alert("welcome to Battle arena.\n\n How we play: \n - Use arrow keys for displacement\n - Click the mouse to shoot \n - A player touched by one bullet is dead \n\n Bring your freinds and enjoy !!");
    let ratio = 16 / 9;
    let width = 1280;
    let height = Math.floor(width * ratio);

    var config = {
        type: Phaser.AUTO,
        width: width,
        height: height,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scene: Game
    };

    var game = new Phaser.Game(config);

})();
