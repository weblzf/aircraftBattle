// 飞机坐标:(x,y)中心     width,height为从(x,y) 四周拓展大小
// a ------- b     ab cd : width
// |         |     bc da : height
// |  (x,y)  |
// |         |
// d ------- c
import EventListener from './EventListener.js'
import Weapon from './Weapon.js'
import _ from './_.js'
import Brush from './Brush.js'


class Plane extends EventListener {
    // options中 必须传入 warehouse参数  值为数组
    constructor(options) {
        super()
        this.checkOptions(options)

        let defaultOptions = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            hp: 0,             // 总hp
            bruise: 0,         // 受到多少伤害
            status: 'live',    // live活 die死; 死不进行碰撞,还是会显示图片
            speed: 0,
            direction: 0,      // 方向 0向上 1向下  朝向
            holder: null,      // 飞机持有者
            hpBar: false,      // 是否显示血条
            arsenal: [],       // 武器库 要配置什么武器
            wingman: [],       // 僚机
            rotateDeg: 0,
            img: {
                src: '',
                x: 0,          // 图片源点
                y: 0,
                width: options.width, //截取面积 不写 默认飞机大小
                height: options.height,
            },
            // 碰撞区域大小      按照显示大小左上角 计算
            // (x,y)---- b     ab cd : width
            // |         |     bc da : height
            // |         |     x,y相对于 plane的显示大小左上角来计算
            // |         |
            // d ------- c
            collisionArea: [{
                x: 0,
                y: 0,
                width: options.width,
                height: options.height,
            }],
        }
        _.assign(this, defaultOptions, options)


        this.init()
    }

    checkOptions(options) {
        let key = ''
        switch (undefined) {
            case options.img:
                throw  new Error('img not defined')
                break
            case options.img.src:
                key = 'img.src'
            case options.width:
                key = 'width'
            case options.height:
                key = 'height'
            case options.holder:
                key = 'holder'
                throw  new Error(`${key} not defined`)
                break
        }
        return this
    }

    init() {
        this.weaponSystem = this.weaponSystem()
        this.wingmanSystem = this.wingmanSystem()

        _.forEach(this.arsenal, (val) => {
            let id
            if (typeof val === 'object') {
                id = val.id || 0
            } else {
                id = val
            }
            let weapon = _.assign({
                id: Number(id),
                holder: this,
            }, val)

            this.weaponSystem.add(weapon)
        })
        _.forEach(this.wingman, (wing) => {
            this.wingmanSystem.add(wing)
        })
    }

    remove() {
        this.holder.emit('removePlane', this, this.holder)
        _.lastForEach(this.weaponSystem.firedBullets, (bullet) => bullet && bullet.remove())

        this.emit('remove', this, this.holder)
        this.status = 'die'
        this.removeAllEvent()
    }

    weaponSystem() {
        let weaponSystem = {
            //武器库
            arsenal: [],
            firedBullets: [],
            status: 'noShoot',
            add: (options) => {
                options.holder = this
                let weapon = new Weapon(options)
                //存入武器库
                weaponSystem.arsenal.push(weapon)

                //将每次射出的子弹 存入
                weapon.on('shoot', (bullets) => {
                    weaponSystem.firedBullets.push(...bullets)
                })
                //将每次输出的子弹 删除
                weapon.on('removeBullet', (bullet) => {
                    _.remove(weaponSystem.firedBullets, bullet)
                })

                this.emit('addWeapon', weapon)
                return weapon
            },
            set: (id, options) => {
                if (id instanceof Weapon) {
                    let weapon = id
                    _.assign(weapon, options)
                } else {
                    _.forEach(weaponSystem.arsenal, (weapon) => {
                        if (weapon.id === id) {
                            _.assign(weapon, options)
                        }
                    })
                }
            },
            remove: (id) => {
                if (id instanceof Weapon) {
                    let weapon = id
                    _.remove(weaponSystem.arsenal, weapon)
                } else {
                    _.remove(weaponSystem.arsenal, (weapon) => weapon.id === id)
                }
            },
            removeAll: () => {
                this.weaponSystem.arsenal = []
                return this
            },
            //射击
            shoot: () => {
                let allBullets = []
                //遍历 所有武器类型
                _.forEach(weaponSystem.arsenal, (weapon) => {
                    allBullets.push(...weapon.shoot())
                })


                this.emit('shoot', allBullets, this)
                return allBullets
            },
            // 持续射击
            // callback必填 用来控制 何时终止   返回false终止
            continuousShoot: (timer, callback) => {
                let boo = true
                let handle
                weaponSystem.status = 'shoot'
                callback = typeof callback === 'function' ? callback : () => this.status === 'live'

                let shootFn = () => {
                    weaponSystem.shoot()
                    if (!callback.call(this, this) && weaponSystem.status !== 'noShoot') {
                        weaponSystem.status = 'noShoot'
                        return Brush.render.remove(handle)
                    }
                }

                if (_.getType(timer) === 'number') {
                    handle = () => {
                        if (boo) {
                            boo = false
                            shootFn()
                            setTimeout(() => boo = true, timer)
                        }
                    }
                } else {
                    handle = () => {
                        shootFn()
                    }
                }

                //若有僚机也开枪
                this.on('addWing', (wing) => {
                    console.log(wing);
                    wing.weaponSystem.continuousShoot(() => {
                        return weaponSystem.status === 'shoot'
                    })
                })

                Brush.render.add(handle)
                return this
            },
            //射出的子弹
            getFiredBullets: () => {
                return _.reduce(weaponSystem.arsenal, (arr, weapon) => {
                    return arr.concat(weapon.firedBullets)
                }, [])
            },
        }

        this.on('removeWeapon', (weapon) => {
            weapon.removeAllEvent()
        })

        return weaponSystem
    }

    //僚机 系统
    wingmanSystem() {
        let wingmanSystem = {
            warehouse: [],
            add: (wing) => {
                // 僚机存入 主飞机的僚机仓库
                wing.holder = this
                wing.x = this.x + wing.relative.x
                wing.y = this.y + wing.relative.y
                wing = new Plane(wing)
                wingmanSystem.warehouse.push(wing)

                //添加僚机事件
                this.emit('addWing', wing, this)
                return wing
            },
            remove: (wing) => {
                _.remove(wingmanSystem.warehouse, wing)
                // 删除僚机事件
                this.emit('removeWing', wing, this)
                return wing
            }
        }

        this.on('removePlane', (wing) => {
            wingmanSystem.remove(wing)
        })

        return wingmanSystem
    }

    //旋转  +deg顺时针  -deg逆时针
    rotate({x, y, deg}) {
        let newPosition = {
            x: (this.x - x) * Math.cos(getDeg(-deg)) - (this.y - y) * Math.sin(getDeg(-deg)) + x,
            y: (this.x - x) * Math.sin(getDeg(-deg)) + (this.y - y) * Math.cos(getDeg(-deg)) + y,
        }
        this.x = Math.round(newPosition.x * 10) / 10
        this.y = Math.round(newPosition.y * 10) / 10

        function getDeg(val) {
            return val * Math.PI / 180
        }

        return this
    }

    //死亡
    die() {
        if (this.status === 'die') {
            return
        }
        this.status = 'die'
        _.forEach(this.wingmanSystem.warehouse, (wing) => {
            wing.die()
        })
        let die = [{
            x: 100,
            y: 11,
            width: 40,
            height: 40,
        }, {
            x: 22,
            y: 14,
            width: 60,
            height: 58,
        }, {
            x: 82,
            y: 77,
            width: 58,
            height: 56,
        }, () => {
            this.remove()
        }]
        _.assign(this, {
            width: 33,
            height: 33,
            hpBar: false,
            img: {
                src: 'src/img/plane/hit.png'
            }
        })
        _.forEach(die, (item, i) => {
            setTimeout(() => {
                if (typeof item === 'function') {
                    item()
                } else {
                    _.assign(this.img, item)
                }
            }, i * 100)
        })
        this.emit('die')
    }

    move() {
        let direction = this.direction === 0 ? -1 : 1
        if (this.rotateDeg) {
            this.x = this.x + direction * Math.sin(radian(-this.rotateDeg)) * this.speed
            this.y = this.y - direction * Math.cos(radian(-this.rotateDeg)) * this.speed
        } else {
            this.y += direction * this.speed
        }

        function radian(deg) {
            return Math.PI / 180 * deg;
        }


        this.step && this.step.call(this, this, this.holder, this.holder.holder)
        this.emit('move', this)
    }
}

Plane.type = (function () {
    let type = [
        { // 飞船 0
            id: 0,
            x: 0, // 坐标
            y: 0,
            width: 80, // 大小
            height: 80,
            status: 'live',//
            hp: 503, // 血
            bruise: 0, //受到多少伤害
            hpBar: false, //血条
            speed: 15, // 速度
            direction: 0,// 方向
            rotateDeg: 180,
            holder: null,//
            arsenal: [0, 1, 2, 3],
            img: {
                src: 'src/img/plane/plane_0.png',
                x: 0, // 图片源 绘制起点
                y: 0,
                width: 128, // 截取图片源大小
                height: 128,
            },
            // 碰撞检测区域 x,y从给定大小左上角
            collisionArea: [{
                x: 31,
                y: 5,
                width: 17,
                height: 33,
            }, {
                x: 11,
                y: 44,
                width: 56,
                height: 26,
            }],
            //被击中的函数  不写 子弹会无视此飞机
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            }
        },
        { // 飞船1
            id: 1,
            x: 0,
            y: 0,
            width: 160,
            height: 124,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_1.png',
                x: 0,
                y: 0,
                width: 160,
                height: 124,
            },
            arsenal: [0],
            collisionArea: [{
                x: 48,
                y: 36,
                width: 72,
                height: 34,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船2
            id: 2,
            x: 0,
            y: 0,
            width: 276,
            height: 204,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_2.png',
                x: 0,
                y: 0,
                width: 276,
                height: 204,
            },
            arsenal: [0],
            collisionArea: [{
                x: 83,
                y: 58,
                width: 112,
                height: 62,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船3
            id: 3,
            x: 0,
            y: 0,
            width: 112,
            height: 79,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_3.png',
                x: 0,
                y: 0,
                width: 112,
                height: 79,
            },
            arsenal: [0],
            collisionArea: [{
                x: 37,
                y: 27,
                width: 39,
                height: 22,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船4
            id: 4,
            x: 0,
            y: 0,
            width: 126,
            height: 116,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_4.png',
                x: 0,
                y: 0,
                width: 126,
                height: 116,
            },
            arsenal: [0],
            collisionArea: [{
                x: 36,
                y: 24,
                width: 56,
                height: 32,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船5
            id: 5,
            x: 0,
            y: 0,
            width: 198,
            height: 206,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_5.png',
                x: 0,
                y: 0,
                width: 198,
                height: 206,
            },
            arsenal: [],
            collisionArea: [{
                x: 52,
                y: 74,
                width: 96,
                height: 61,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船6
            id: 6,
            x: 0,
            y: 0,
            width: 72,
            height: 82,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_6.png',
                x: 0,
                y: 0,
                width: 72,
                height: 82,
            },
            arsenal: [0],
            collisionArea: [{
                x: 27,
                y: 46,
                width: 20,
                height: 34,
            }, {
                x: 4,
                y: 22,
                width: 64,
                height: 26,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船7
            id: 7,
            x: 0,
            y: 0,
            width: 125,
            height: 91,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_7.png',
                x: 0,
                y: 0,
                width: 125,
                height: 91,
            },
            arsenal: [0],
            collisionArea: [{
                x: 26,
                y: 26,
                width: 73,
                height: 37,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船8
            id: 8,
            x: 0,
            y: 0,
            width: 73,
            height: 83,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_8.png',
                x: 0,
                y: 0,
                width: 73,
                height: 83,
            },
            arsenal: [0],
            collisionArea: [{
                x: 24,
                y: 20,
                width: 25,
                height: 37,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船6
            id: 9,
            x: 0,
            y: 0,
            width: 198,
            height: 246,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_9.png',
                x: 0,
                y: 0,
                width: 198,
                height: 246,
            },
            arsenal: [0],
            collisionArea: [{
                x: 57,
                y: 69,
                width: 85,
                height: 67,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船10
            id: 10,
            x: 0,
            y: 0,
            width: 126,
            height: 108,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_10.png',
                x: 0,
                y: 0,
                width: 126,
                height: 108,
            },
            arsenal: [0],
            collisionArea: [{
                x: 35,
                y: 32,
                width: 59,
                height: 34,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船11
            id: 11,
            x: 0,
            y: 0,
            width: 60,
            height: 43,
            hp: 53,
            speed: 6,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_11.png',
                x: 0,
                y: 0,
                width: 60,
                height: 43,
            },
            arsenal: [0],
            collisionArea: [{
                x: 7,
                y: 22,
                width: 46,
                height: 9,
            }, {
                x: 27,
                y: 9,
                width: 7,
                height: 11,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船12
            id: 12,
            x: 0,
            y: 0,
            width: 152,
            height: 115,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_12.png',
                x: 0,
                y: 0,
                width: 152,
                height: 115,
            },
            arsenal: [0],
            collisionArea: [{
                x: 26,
                y: 50,
                width: 103,
                height: 25,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船13
            id: 13,
            x: 0,
            y: 0,
            width: 100,
            height: 70,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_13.png',
                x: 0,
                y: 0,
                width: 100,
                height: 70,
            },
            arsenal: [0],
            collisionArea: [{
                x: 38,
                y: 25,
                width: 24,
                height: 32,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },
        { // 飞船14
            id: 14,
            x: 0,
            y: 0,
            width: 100,
            height: 85,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/plane/plane_14.png',
                x: 0,
                y: 0,
                width: 100,
                height: 85,
            },
            arsenal: [0],
            collisionArea: [{
                x: 27,
                y: 24,
                width: 47,
                height: 29,
            }],
            beHit: (bullet, plane) => {
                plane.bruise += bullet.damage
                if (plane.bruise >= plane.hp) {
                    plane.die()
                }
            },
        },

    ]
    return {
        add(plane) {
            plane.id = type.length
            type.push(plane)
            return plane
        },
        get (id, scale) {
            if (id >= type.length) {
                throw new Error('not defined plane')
            } else {
                scale = typeof scale === 'number' ? scale : 1
                let plane = _.deepCopy(type[id])
                plane.width *= scale
                plane.height *= scale
                _.forEach(plane.collisionArea, (area) => {
                    area.x *= scale
                    area.y *= scale
                    area.width *= scale
                    area.height *= scale
                })
                return plane
            }
        }
    }
})();

export default Plane