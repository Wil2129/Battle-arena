const colyseus = require('colyseus')
const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const MapSchema = schema.MapSchema;
//const ArraySchema = schema.ArraySchema;
const type = schema.type;

class Player extends Schema {}
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "rotation");

class Bullet extends Schema {}
type("number")(Bullet.prototype, "x");
type("number")(Bullet.prototype, "y");
type("number")(Bullet.prototype, "angle");
type("number")(Bullet.prototype, "speed_x");
type("number")(Bullet.prototype, "speed_y");
type("number")(Bullet.prototype, "index");



class State extends Schema {
    constructor() {
        super();

        this.players = new MapSchema();
        this.bullets = new MapSchema();
        this.nextPosition = 0;
        this.bullet_index = 0;
    }

    getNextPosition() {
        let position = (this.nextPosition % 4) + 1;
        ++this.nextPosition;
        return position;
    }

    createBullet(id, data) {
        let bullet = new Bullet();
        bullet.index = this.bullet_index;
        bullet.x = data.x;
        bullet.y = data.y;
        bullet.angle = data.angle;
        bullet.speed_x = data.speed_x;
        bullet.speed_y = data.speed_y;
        bullet.distanceTravelled = 0;
        bullet.owner_id = id;
        this.bullets[this.bullet_index++] = bullet;
    }

    moveBullet(index) {
        let old_x = this.bullets[index].x;
        let old_y = this.bullets[index].y;

        this.bullets[index].x -= this.bullets[index].speed_x;
        this.bullets[index].y -= this.bullets[index].speed_y;

        let dx = this.bullets[index].x - old_x;
        let dy = this.bullets[index].y - old_y;

        this.bullets[index].distanceTravelled += Math.sqrt(dx * dx + dy * dy);
    }

    removeBullet(index) {
        delete this.bullets[index];
    }



    createPlayer(id) {
        this.players[id] = new Player();
    }

    getPlayer(id) {
        return this.players[id];
    }

    newPlayer(id) {
        return this.players[id];
    }

    removePlayer(id) {
        delete this.players[id];
    }

    setPlayerPosition(id, position) {
        this.players[id].x = position.x;
        this.players[id].y = position.y;
    }

    movePlayer(id, movement) {
        let player = this.players[id];
        player.x = movement.x;
        player.y = movement.y;
        player.rotation = movement.rotation
    }

}
type({
    map: Player
})(State.prototype, "players");
type({
    map: Bullet
})(State.prototype, "bullets");

exports.outdoor = class extends colyseus.Room {

    onInit() {
        this.setState(new State());
        this.clock.setInterval(this.ServerGameLoop.bind(this), 16);
    }

    onJoin(client, options) {
        let nextPosition = this.state.getNextPosition();
        this.state.createPlayer(client.sessionId);
        this.send(client, {
            event: "start_position",
            position: nextPosition
        });

        this.broadcast({
            event: "new_player",
            position: nextPosition,
            id: client.sessionId
        }, {
            except: client
        });

    }

    onMessage(client, message) {
        switch (message.action) {

            case "initial_position":
                if (this.state.getPlayer(client.sessionId) == undefined) return; // Happens if the server restarts and a client is still connected
                this.state.setPlayerPosition(client.sessionId, message.data);
                break;

            case "move":
                if (this.state.getPlayer(client.sessionId) == undefined) return;
                this.state.movePlayer(client.sessionId, message.data);
                break;

            case "shoot_bullet":
                if (this.state.getPlayer(client.sessionId) == undefined) return;
                if (Math.abs(message.data.speed_x) <= 100 && Math.abs(message.data.speed_y) <= 100) {
                    this.state.createBullet(client.sessionId, message.data);
                }
                break;

            default:
                break;
        }
    }
    onLeave(client, consented) {
        this.state.removePlayer(client.sessionId);
    }

    onDispose() {}

    // Update the bullets 60 times per frame and send updates 
    ServerGameLoop() {
                            
        for (let i in this.state.bullets) {
            this.state.moveBullet(i);
            //remove the bullet if it goes too far
            if (this.state.bullets[i].x < -10 || this.state.bullets[i].x > 3200 || this.state.bullets[i].y < -10 || this.state.bullets[i].y > 3200 || this.state.bullets[i].distanceTravelled >= 800) {
                this.state.removeBullet(i);
            } else {
                //check if this bullet is close enough to hit a player
                for (let id in this.state.players) {
                    if (this.state.bullets[i].owner_id != id) {
                        //because your own bullet shouldn't kill hit
                        let dx = this.state.players[id].x - this.state.bullets[i].x;
                        let dy = this.state.players[id].y - this.state.bullets[i].y;
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 30) {
                            this.broadcast( {
                                event: "hit",
                                punished_id: id,
                                punisher_id: this.state.bullets[i].owner_id
                            });
                            this.state.removeBullet(i);
                            this.state.removePlayer(id);
                            return;
                        }
                    }
                }
            }
        }
    }
}