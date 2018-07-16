// 武器

import EventListener from './EventListener.js'
import Bullet from './Bullet.js'
import _ from './_.js'

class Weapon extends EventListener {
    constructor(options) {
        super()
        this.checkOptions(options)

        let defaultOptions = {
            id: 0,            //武器ID
            holder: null,     //武器持有者
            attackTime: 100,  //攻击间隔
            loadStatus: true, //子弹是否装载
            counter: 0,       //射击次数计数器
            firedBullets: [], //已经射出的子弹
            bullets: [],       //每次射击的子弹
        }

        _.assign(this, defaultOptions, Weapon.type.get(options.id), options)

        this.init()
    }

    checkOptions(options) {
        if (typeof options.id !== "number") {
            throw Error('id must is number')
        }
    }

    init() {
        this.on('removeBullet', (bullet) => {
            this.removeBullet(bullet)
        })
    }

    shoot() {
        //是否装载子弹
        if (this.loadStatus) {
            //射击次数
            this.counter++
            //创建子弹
            let bullets = this.createBullet()
            //添加到已射击
            this.firedBullets.push(...bullets)
            //修改状态
            this.loadStatus = false
            //装载好后再次修改状态
            setTimeout(() => {
                this.loadStatus = true
            }, this.attackTime)
            //触发shoot事件
            this.emit('shoot', bullets, this)
            return bullets
        }
        return []
    }

    createBullet() {
        let holder = this.holder
        let bullets = typeof this.bullets === 'function' ? this.bullets() : this.bullets
        let bulletArray = _.map(bullets, (bulletData) => {
            let bullet = new Bullet(_.assign(
                bulletData,
                {
                    x: holder.x + bulletData.relative.x,
                    y: holder.y + (holder.direction === 0 ? -1 : 1) * bulletData.relative.y,
                    direction: holder.direction,
                    holder: this, //创建者
                }
            ))
            return bullet
        })

        this.emit('create', bulletArray, this)
        return bulletArray
    }

    //删除此武器 (通知上级删除)
    remove() {
        this.holder.emit('removeWeapon', this, this.holder)

        this.emit('remove', this, this.holder)
        this.removeAllEvent()
    }

    removeBullet(bullet) {
        this.holder.emit('removeBullet', bullet, this)

        return _.remove(this.firedBullets, bullet)

    }
}

Weapon.type = (function () {
    let type = [
        {   //武器 0
            id: 0, //武器ID
            attackTime: 100, //攻击间隔
            loadStatus: true, //子弹是否装载
            counter: 0,//射击次数计数器
            bullets: [ //每次射出的子弹  可以写函数 必须返回数组
                Bullet.type.get(0)
            ],
            //武器每次射击执行的函数
            shootStep: null
        },
        {   //武器 1
            id: 1, //武器ID
            attackTime: 2000, //攻击间隔
            loadStatus: true, //子弹是否装载
            counter: 0,//射击次数计数器
            bullets: (function () {
                let temp = Bullet.type.get(0)
                let bulletArray = []
                for (let i = 0; i < 360; i += 15) {
                    let bullet = _.deepCopy(temp)
                    bullet.rotateDeg = i
                    bulletArray.push(bullet)
                }
                return bulletArray
            })(),
            //武器每次射击执行的函数
            shootStep: null
        },
        {  //武器 2
            id: 2, //武器ID
            attackTime: 400, //攻击间隔
            loadStatus: true, //子弹是否装载
            counter: 0,//射击次数计数器
            bullets: (function () {
                let bullet = Bullet.type.get(1)
                let arr = []
                for (let i = 1; i <= 2; i++) {
                    let o = _.deepCopy(bullet)
                    o.rotateDeg = -12 + i * 8
                    arr.push(o)
                }
                return arr
            })(),
            //武器每次射击执行的函数
            shootStep: null
        },
        {  //武器 3
            id: 3, //武器ID
            attackTime: 400, //攻击间隔
            loadStatus: true, //子弹是否装载
            counter: 0,//射击次数计数器
            bullets: (function () {
                let bullet = Bullet.type.get(2)
                return _.map([1, 2, 3, 4, 5], (n, i) => {
                    return _.assign(_.deepCopy(bullet), {
                        relative: {
                            x: n * 10 - 30,
                            y: Math.abs(n - 3) * -15 + 27,
                        }
                    })
                })
            })(),
            //武器每次射击执行的函数
            shootStep: null
        },
        {  //武器 4  激光
            id: 4, //武器ID
            attackTime: 200000000, //攻击间隔
            loadStatus: true, //子弹是否装载
            counter: 0,//射击次数计数器
            bullets: [Bullet.type.get(3)],
            //武器每次射击执行的函数
            shootStep: null,
        },
    ]
    return {
        add(weapon) {
            let id = type.length
            weapon.id = id
            type.push(weapon)
            return id
        },
        get (id, options) {
            if (id >= type.length) {
                throw new Error('undefined weapon')
            } else {
                let weapon = _.assign(_.deepCopy(type[id]), options)
                return weapon
            }
        }
    }
})()

export default Weapon