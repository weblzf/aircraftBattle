// bullet的坐标 大小 如图
//    a ------- b     ab cd : width
//    |         |     bc da : height
//    |  (x,y)  |     x,y 坐标
//    |         |
//    d ------- c
import EventListener from './EventListener.js'
import _ from './_.js'

class Bullet extends EventListener {
    // options选项 必须传入 warehouse参数 值为数组
    constructor(options) {
        super()

        Bullet.checkOptions(options)

        let defaultOptions = {
            x: 0,                   //位置  中心点
            y: 0,
            width: '',              //显示大小
            height: '',
            rotateDeg: '',          //子弹自身旋转角度 中心旋转 (顺时针)
            speed: '',              //速度
            damage: '',             //攻击力 伤害
            direction: 0,           //子弹朝向; 0表示向上,1向下
            status: 'live',         //live活 die死; 子弹是否活着,影响是否进行飞机碰撞判断,还是会显示图像
            holder: '',             //子弹持有人
            img: {
                src: '',
                x: '',     //图片源点
                y: '',
                width: '', //截取面积  默认图片大小
                height: '',
            },
            // 碰撞区域大小      按照显示大小左上角 计算
            // (x,y)---- b     ab cd : width
            // |         |     bc da : height
            // |         |     x,y相对于 bullet的显示大小左上角来计算
            // |         |
            // d ------- c
            collisionArea: [{
                x: 0,      //x,y相对于 bullet的显示大小左上角来计算
                y: 0,
                width: options.width, //默认大小
                height: options.height,
            }],
            step: null,              //每次移动触发的函数

            hit(plane, bullet) {     //击中函数  当你击中飞船时触发   没有此函数也会击中飞机
                //击中删除此子弹
                bullet.remove()
            },
            _ignoreBeyondView_: false,// 超过视图 不被删除
        }

        _.assign(this, defaultOptions, options)

    }

    static checkOptions(options) {
        let key = ''
        switch (undefined) {
            case options.img:
                throw new Error('img is undefined')
            case options.img.src:
                key = 'img.src'
                break
            case options.width:
                key = 'width'
                break
            case options.height:
                key = 'height'
                break
            case options.damage:
                key = 'damage'
                break
            case options.holder:
                key = 'holder'
                throw new Error(`${key}  is undefined`)
        }
    }

    move() {
        let direction = this.direction === 0 ? -1 : 1
        if (this.rotateDeg) {
            // 子弹的旋转是顺时针的        而数学计算是逆时针  所以要用 负的
            this.x = this.x + direction * Math.sin(radian(-this.rotateDeg)) * this.speed
            this.y = this.y + direction * Math.cos(radian(-this.rotateDeg)) * this.speed
        } else {
            this.y += direction * this.speed
        }

        function radian(deg) {
            return Math.PI / 180 * deg;
        }

        this.step && this.step.call(this, this, this.holder, this.holder.holder)
        this.emit('move', this)
    }

    die() {
        this.status = 'die'

        this.emit('die', this)
    }

    remove() {
        this.holder.emit('removeBullet', this, this.holder)
        this.emit('remove', this)

        this.removeAllEvent()
    }
}

Bullet.type = (function () {
    let type = [
        {
            id: 0,
            relative: {
                x: 0,
                y: -10,
            },
            width: 12,
            height: 40,
            damage: 10,
            speed: 15,
            img: {
                src: 'src/img/bullet/bullet.png', //路径
                x: 509, //图片绘制源坐标
                y: 522,
                width: 12, //截取大小
                height: 40,
            },
            //旋转   以武器所在点 为坐标轴
            rotateDeg: 0,
            step: null, //子弹每次移动 执行的函数
        },
        {
            id: 1,
            relative: {
                x: 0,
                y: 0,
            },
            width: 8,
            height: 95,
            damage: 10,
            speed: 15,
            img: {
                src: 'src/img/bullet/bullet.png', //路径
                x: 245, //图片绘制源坐标
                y: 178,
                width: 8, //截取大小
                height: 95,
            },
            //旋转   以武器所在点 为坐标轴
            rotateDeg: -10,
            step: null, //子弹每次移动 执行的函数
        },
        {
            id: 2,
            relative: {
                x: 0,
                y: -10,
            },
            width: 23,
            height: 122,
            damage: 6,
            speed: 20,
            img: {
                src: 'src/img/bullet/bullet.png', //路径
                x: 104, //图片绘制源坐标
                y: 12,
                width: 23, //截取大小
                height: 122,
            },
            collisionArea: [{
                x: 5,
                y: 9,
                width: 13,
                height: 101,
            }],
            //旋转   以武器所在点 为坐标轴
            rotateDeg: 0,
            step: null, //子弹每次移动 执行的函数
        },
        {
            id: 3,
            relative: {
                x: 0,
                y: 396,
            },
            _ignoreBeyondView_: true, // 超过视图 不被删除
            width: 73,
            height: 792,
            damage: 2,
            speed: 0,
            img: {
                src: 'src/img/bullet/laser.png', //路径
                x: 0, //图片绘制源坐标
                y: 0,
                width: 73, //截取大小
                height: 792,
            },
            collisionArea: [{
                x: 20,
                y: 0,
                width: 16,
                height: 792,
            }, {
                x: 36,
                y: 0,
                width: 16,
                height: 792,
            }],
            //旋转   以武器所在点 为坐标轴
            rotateDeg: 0,
            step(bullet, weapon, plane) {
                //激光贴图滚动
                bullet.img.y += 10
                bullet.img.y %= 792
                bullet.x = plane.x
                bullet.y = plane.y - 395
                //复原
                bullet.height = 792
                bullet.img.height = 792
                bullet.collisionArea = [{
                    x: 20,
                    y: 0,
                    width: 16,
                    height: 792,
                }, {
                    x: 36,
                    y: 0,
                    width: 16,
                    height: 792,
                }]
            }, //子弹每次移动 执行的函数
            hit(plane, bullet) {
                let height = -(plane.y - bullet.holder.holder.y)
                bullet.height = height
                bullet.img.height = height

                bullet.y = bullet.holder.holder.y - height / 2

                bullet.collisionArea = [{
                    x: 20,
                    y: 0,
                    width: 16,
                    height
                }, {
                    x: 36,
                    y: 0,
                    width: 16,
                    height
                }]
            }
        },
        {
            id: 4,
            x: 0,
            y: 0,
            width: 93.6,
            height: 87,
            hp: 53,
            speed: 3,
            direction: 1,
            bruise: 0,
            hpBar: false,
            img: {
                src: 'src/img/info/other_drop/weapon_upgrades.png',
                x: 0,
                y: 0,
                width: 87,
                height: 93.6,
            },
            arsenal: [],
            collisionArea: [],
            step() {
                this.img.y += 93.6
                if (this.img.y >= 93.6 * 9) {
                    this.img.y = 0
                }
            },
            hit: (bullet, plane) => {
            },
        },
    ]
    return {
        add(bullet) {
            let id = type.length
            bullet.id = id
            type.push(bullet)
            return id
        },
        get(id) {
            if (id >= type.length) {
                throw new Error('undefined plane')
            } else {
                return _.deepCopy(type[id])
            }
        }
    }
})()

export default Bullet