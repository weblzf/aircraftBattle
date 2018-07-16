// 两种 坐标定位 对象
// a ------- b     ab cd : width
// |         |     bc da : height
// |  (x,y)  |     x,y 中心
// |         |
// d ------- c
// plane,bullet中的碰撞区域也采用此坐标定位 相对于 plane和bullet的自身进行定位
// (x,y) ----- b     ab cd : width
//   |         |     bc da : height
//   |  (x,y)  |     x,y 左上角
//   |         |
//   d ------- c
import EventListener from './EventListener.js'
import _ from './_.js'
import Brush from './Brush.js'
import BackgroundScroll from './BackgroundScroll.js'
import Plane from './Plane.js'
import Weapon from './Weapon.js'
import Bullet from './Bullet.js'

class Game extends EventListener {
    constructor(options) {
        super()
        this.checkOptions(options)

        let defaultOptions = {
            width: window.innerWidth,
            height: window.innerHeight,
            container: null,
            canvas: null,
            backgroundScroll: {
                node: null,
                img: {
                    src: ''
                },
                speed: 1,
            },
        }
        _.assign(this, defaultOptions, options)

        this.init()
    }

    checkOptions(options) {
        if (!options.canvas || options.canvas.nodeName !== 'CANVAS') {
            throw new Error('canvas is undefined')
        }
    }

    init() {
        this.brushSystem = this.brushSystem()
        this.planeSystem = this.planeSystem()
        this.bindEventSystem = this.bindEventSystem()
        this.backgroundScrollSystem = this.backgroundScrollSystem()
        this.drawSystem = this.drawSystem()
        this.levelSystem = this.levelSystem()
    }

    start() {
        this.bindEventSystem.start()
        this.backgroundScrollSystem.start()
        this.drawSystem.start()
        this.brushSystem.translate({
            x: this.width / 2,
            y: this.height / 2,
        })
        this.levelSystem.start()
    }

    planeSystem() {
        let planeSystem = {
            players: [],
            enemies: [],
            create: (options) => {
                options.holder = this
                let plane = new Plane(options)

                this.emit('createPlane', plane)
                return plane
            },
            createPlayer: (planeData, options) => {
                _.assign(planeData, options)
                let plane = planeSystem.create(planeData)
                planeSystem.players.push(plane)

                //触发plane的remove事件时
                plane.on('remove', () => {
                    _.remove(planeSystem.players, plane)
                })

                this.emit('createPlayer', plane)
                return plane
            },
            createEnemy: (planeData, options) => {
                _.assign(planeData, options)
                let plane = planeSystem.create(planeData)
                planeSystem.enemies.push(plane)

                //触发plane的remove事件时
                plane.on('remove', () => {
                    _.remove(planeSystem.enemies, plane)
                })
                this.emit('createEnemy', plane)
                return plane
            },
            remove: (plane) => {
                return plane.remove()
            },
            // players  enemies
            // 返回动态数组
            getAllFiredBullets: (type) => {
                let arrayName, eventName
                if (type === 'players') {
                    [arrayName, eventName] = ['players', 'createPlayer']
                } else if (type === 'enemies') {
                    [arrayName, eventName] = ['enemies', 'createEnemy']
                } else {
                    throw new Error('players or enemies')
                }

                let allBullets = []
                //现有的
                _.forEach(planeSystem[arrayName], (plane) => {
                    gatherBullet(plane)
                })
                this.on(eventName, (plane) => {
                    gatherBullet(plane)
                })

                //所有子弹
                function gatherBullet(plane) {
                    //若有子弹
                    if (plane.weaponSystem && plane.weaponSystem.firedBullets) {
                        allBullets.push(...plane.weaponSystem.firedBullets)
                    }
                    //飞机再次射击时
                    plane.on('shoot', (bullets) => {
                        allBullets.push(...bullets)
                    })
                    //所有武器删除子弹时
                    plane.on('removeBullet', (bullet) => {
                        _.remove(allBullets, bullet)
                    })
                    //若已有僚机
                    if (plane.wingmanSystem && plane.wingmanSystem.warehouse) {
                        _.forEach(plane.wingmanSystem.warehouse, (wing) => {
                            gatherBullet(wing)
                        })
                    }
                    //僚机的子弹
                    plane.on('addWing', (wing) => {
                        gatherBullet(wing)
                    })
                }

                return allBullets
            }
        }

        this.on('removePlane', (plane) => {
        })

        return planeSystem
    }

    backgroundScrollSystem() {
        return new BackgroundScroll(this.backgroundScroll)
    }

    bindEventSystem() {
        //事件绑定的容器s
        let container = this.container || this.canvas
        let playerArray = this.planeSystem.players
        let coordinate = {x: 0, y: 0}
        //是否超出视图 返回true超出
        let x_BeyondView = (data) => {
            if (data.x <= this.width / 2 &&
                data.x >= -this.width / 2) {
                return false;
            }
            return true;
        }
        let y_BeyondView = (data) => {
            if (data.y <= this.height / 2 &&
                data.y >= -this.height / 2) {
                return false;
            }
            return true;
        }

        let touch = {
            start: (e) => {
                let point = e.touches[0]
                coordinate.x = Math.round(point.pageX)
                coordinate.y = Math.round(point.pageY)
                // 取消默认
                // 修正某些手机 触点事件不灵
                e.preventDefault()

                container.addEventListener('touchmove', touch.move);
                container.addEventListener('touchend', touch.end);

                container.removeEventListener('touchstart', touch.start);

                this.emit('touchStart', e)
            },
            move: (e) => {
                let point = e.touches[0]
                let newCoordinate = {
                    x: Math.round(point.pageX),
                    y: Math.round(point.pageY),
                }

                _.forEach(playerArray, (plane) => {
                    let newPlaneCoordinate = {
                        x: plane.x + newCoordinate.x - coordinate.x,
                        y: plane.y + newCoordinate.y - coordinate.y,
                    }
                    //true就超过了
                    if (x_BeyondView(newPlaneCoordinate)) {
                        newPlaneCoordinate.x = plane.x
                    }

                    if (y_BeyondView(newPlaneCoordinate)) {
                        newPlaneCoordinate.y = plane.y
                    }
                    plane.x = newPlaneCoordinate.x
                    plane.y = newPlaneCoordinate.y
                    //僚机位置修正
                    if (plane.wingmanSystem && plane.wingmanSystem.warehouse) {
                        _.forEach(plane.wingmanSystem.warehouse, (wing) => {
                            wing.x = wing.relative.x + plane.x
                            wing.y = wing.relative.y + plane.y
                        })
                    }
                })

                coordinate.x = newCoordinate.x
                coordinate.y = newCoordinate.y
                // 取消默认
                // 修正某些手机 触点事件不灵
                this.emit('touchMove', e)
            },
            end: (e) => {
                container.addEventListener('touchstart', touch.start)

                container.removeEventListener('touchmove', touch.move)
                container.removeEventListener('touchend', touch.end)

                this.emit('touchEnd', e)
            }
        }


        let bindEventSystem = {
            status: 'stop',
            start: () => {
                if (bindEventSystem.status === 'stop') {
                    bindEventSystem.status = 'start'

                    container.addEventListener('touchstart', touch.start)

                    this.emit('bindEventStart')
                }
            },
            stop: () => {
                if (bindEventSystem.status === 'start') {
                    bindEventSystem.status = 'stop'

                    container.removeEventListener('touchstart', touch.start)
                    container.removeEventListener('touchmove', touch.move)
                    container.removeEventListener('touchend', touch.end)

                    this.emit('bindEventStop')
                }
            }
        }


        return bindEventSystem
    }

    brushSystem() {
        return new Brush(this)
    }

    drawSystem() {
        let brush = this.brushSystem
        let {players, enemies} = this.planeSystem
        let playersFiredBullets = this.planeSystem.getAllFiredBullets('players')
        let enemiesFiredBullets = this.planeSystem.getAllFiredBullets('enemies')

        let handle = () => {
            //先绘制 所有的 plane和bullet
            drawPlanesAndBullets()
            //plane和bullet进行碰撞
            planesAndBulletsHandle(players, enemiesFiredBullets)
            planesAndBulletsHandle(enemies, playersFiredBullets)
        }

        //绘制飞机 子弹
        let drawPlanesAndBullets = () => {
            brush.clear()
            //绘制子弹
            _.forEach(playersFiredBullets.concat(enemiesFiredBullets), (bullet) => {
                drawImg(bullet)
                bullet.move()
                if (bullet._ignoreBeyondView_) {
                    return
                }
                //超出视图
                if (beyondView(bullet)) {
                    bullet.remove()
                    bullet.emit('beyondView', bullet, this)
                }
            })
            //绘制飞机
            _.forEach(players.concat(enemies), (plane) => {
                drawImg(plane)
                plane.hpBar && drawHPBar(plane)
                if (plane.wingmanSystem.warehouse) {
                    _.forEach(plane.wingmanSystem.warehouse, (wing) => {
                        drawImg(wing)
                        wing.hpBar && drawHPBar(wing)
                    })
                }
            })
        }

        //飞机 与 子弹 碰撞计算
        //只能使用 lastForEach  因为可能会删除飞船或子弹
        let planesAndBulletsHandle = (planeArray, bulletArray) => {
            //遍历飞机
            _.lastForEach(planeArray, (plane) => {
                //飞船有被击中 函数 就跳过
                if (typeof plane.beHit !== 'function' || plane.status === 'die') {
                    return
                }
                //获取飞机的 实时碰撞区域 centerCoordinates(中心坐标)
                let plane_Areas = getCollisionAreas(plane)

                //遍历对方子弹
                _.lastForEach(bulletArray, (bullet) => {
                    //获取子弹的 实时碰撞区域  centerCoordinates(中心坐标)
                    let bullet_Areas = getCollisionAreas(bullet)
                    //子弹 与 每个碰撞区域
                    for (let i = 0; i < plane_Areas.length; i++) {
                        //单个碰撞区域 进行检测
                        let planeArea = plane_Areas[i]
                        for (let j = 0; j < bullet_Areas.length; j++) {
                            let bulletArea = bullet_Areas[j]
                            // 转换为cornerCoordinates(左上角坐标)后 进行碰撞检测
                            if (_.rectCollision(coordinateCorrect(planeArea), coordinateCorrect(bulletArea))) {
                                plane.beHit && plane.beHit.call(plane, bullet, plane)
                                bullet.hit && bullet.hit.call(bullet, plane, bullet)
                                return
                            }
                        }
                    }

                })
            })
        }

        //绘制图像
        function drawImg(data) {
            let rotateDeg = data.direction === 0 ? data.rotateDeg : data.rotateDeg + 180
            if (rotateDeg &&
                typeof rotateDeg === 'number' &&
                rotateDeg !== 0) {
                brush.noEffect(() => {
                    brush
                        .rotate({
                            x: data.x,
                            //canvas的坐标与数学坐标系的y轴相反
                            y: data.y,
                            deg: rotateDeg,
                        })
                        .drawImage(data.img.src, ({width, height}) => [
                            data.img.x || 0,
                            data.img.y || 0,
                            data.img.width || width,
                            data.img.height || height,
                            data.x - data.width / 2,
                            data.y - data.height / 2,
                            data.width,
                            data.height,
                        ])
                })
            } else {
                brush
                    .drawImage(data.img.src, ({width, height}) => [
                        data.img.x || 0,
                        data.img.y || 0,
                        data.img.width || width,
                        data.img.height || height,
                        data.x - data.width / 2,
                        data.y - data.height / 2,
                        data.width,
                        data.height,
                    ])
            }
        }

        //绘制血条
        function drawHPBar(plane) {
            brush
                .drawImage('src/img/plane/hpBar/enemy_blood_none.png', ({width, height}) => [
                    0,
                    0,
                    width,
                    height,
                    plane.x - plane.width / 2,
                    plane.y - plane.height / 2 + plane.height,
                    plane.width,
                    10,
                ])
                .drawImage('src/img/plane/hpBar/enemy_blood_full.png', ({width, height}) => [
                    0,
                    0,
                    plane.width * (plane.hp - plane.bruise) / plane.hp,
                    height,
                    plane.x - plane.width / 2,
                    plane.y - plane.height / 2 + plane.height,
                    plane.width * (plane.hp - plane.bruise) / plane.hp,
                    10,
                ])

        }

        //   -
        //-     +
        //   +
        //是否超出视图 true超出
        let beyondView = (data) => {
            if (data.x <= this.width / 2 + 100 &&
                data.x >= -this.width / 2 - 100 &&
                data.y <= this.height / 2 + 100 &&
                data.y >= -this.height / 2 - 100) {
                return false;
            }
            return true;
        }

        //碰撞区域
        //将碰撞区域的坐标修正为下图  且将定位修正为相对于画布
        // a ------- b     ab cd : width
        // |         |     bc da : height
        // |  (x,y)  |
        // |         |
        // d ------- c
        function getCollisionAreas(data) {
            let rotateDeg = data.direction === 0 ? data.rotateDeg : data.rotateDeg + 180
            return _.map(data.collisionArea, (area) => ({
                x: data.x - data.width / 2 + area.x + area.width / 2,
                y: data.y - data.height / 2 + area.y + area.height / 2,
                width: area.width,
                height: area.height,
                rotateDeg: rotateDeg,
            }))
        }

        // 坐标修正   以供 _.parseCoordinate 进行碰撞判断
        // 修改为下图定位坐标
        // (x,y)---- b     ab cd : width
        // |         |     bc da : height
        // |         |
        // |         |
        // d ------- c
        function coordinateCorrect({x, y, width, height, rotateDeg}) {
            return {
                x: x - width / 2,
                y: y - height / 2,
                width: width,
                height: height,
                rotateDeg: rotateDeg,
            }
        }

        let draw = {
            status: 'stop',
            start: () => {
                if (draw.status === 'stop') {
                    draw.status = 'start'
                    Brush.render.add(handle)
                }
            },
            stop: () => {
                if (draw.status === 'start') {
                    draw.status = 'stop'
                    Brush.render.remove(handle)
                }
            },
        }
        return draw
    }

    levelSystem() {
        let lv = 0
        let enemy = this.planeSystem.createEnemy
        let get = (type, options) => {
            switch (type.toLowerCase()) {
                case 'plane':
                    type = Plane.type.get
                    break
                case 'weapon':
                    type = Weapon.type.get
                    break
                case 'bullet':
                    type = Bullet.type.get
                    break
                default :
                    throw new Error('type error')
            }
            return _.assign(type(options.id, options.scale), options)
        }
        let allDie = (arr, callback) => {
            let i = 0
            _.forEach(arr, (plane) => {
                plane.on('die', () => {
                    i++
                    if (i === arr.length) {
                        callback()
                    }
                })
            })
        }
        let draw = Brush.render.add
        let remove = Brush.render.remove
        let player = this.planeSystem.players[0]

        const Level = [
            {   //第一关
                50: () => {
                    player = this.planeSystem.players[0]
                    let enemies = [
                        enemy(get('plane', {id: 11, x: -164, y: -500, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 11, x: -82, y: -450, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 11, x: 0, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 11, x: 82, y: -450, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 11, x: 164, y: -500, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                    ]
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.move()
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                450: () => {
                    let enemies = []
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => {
                            enemies.push(enemy(get('plane', {id: 11, x: -300, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000))
                        }, i * 2000)
                    }
                    _.forEach(this.planeSystem.players, (plane) => {
                        plane.weaponSystem.add(Weapon.type.get(3))
                        plane.weaponSystem.remove(0)
                    })
                    let i = 0
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.x++
                            enemy.y += 2
                            //显示武器升级
                            if (++i < 70) {
                                this.brushSystem.drawImage('src/img/info/info.png', ({width, height}) => {
                                    return [5, 3, 124, 30, player.x - player.width / 2, player.y - i, 124, 30]
                                })
                            }
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                850: () => {
                    let enemies = [
                        enemy(get('plane', {id: 6, x: -164, y: -500, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 6, x: -82, y: -450, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 6, x: 0, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 6, x: 82, y: -450, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 6, x: 164, y: -500, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                    ]
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.move()
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                1250: () => {
                    let enemies = []
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => {
                            enemies.push(enemy(get('plane', {id: 11, x: 300, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000))
                        }, i * 2000)
                    }
                    let i = 0
                    _.forEach(this.planeSystem.players, (plane) => {
                        plane.wingmanSystem.add(_.assign(Plane.type.get(7, 0.3), {
                            relative: {x: -50, y: -40},
                            arsenal: [2],
                            direction: 0,
                            rotateDeg: 180,
                        }))
                        plane.wingmanSystem.add(_.assign(Plane.type.get(7, 0.3), {
                            relative: {x: 50, y: -40},
                            arsenal: [2],
                            direction: 0,
                            rotateDeg: 180,
                        }))
                    })
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.x--
                            enemy.y += 2
                            if (++i < 70) {
                                this.brushSystem.drawImage('src/img/info/info.png', ({width, height}) => {
                                    return [5, 3, 124, 30, player.x - player.width / 2, player.y - i, 124, 30]
                                })
                            }
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                1650: () => {
                    let enemies = []
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => {
                            enemies.push(enemy(get('plane', {id: 14, arsenal: [3], hp: 100, x: -300, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000))
                        }, i * 2000)
                    }
                    _.forEach(this.planeSystem.players, (plane) => {
                        plane.weaponSystem.add(Weapon.type.get(4))
                        plane.weaponSystem.remove(3)
                    })
                    let o = this.planeSystem.players[0]
                    let i = 0
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.x++
                            enemy.y += 2
                            //显示武器升级
                            if (++i < 70) {
                                this.brushSystem.drawImage('src/img/info/info.png', ({width, height}) => {
                                    return [5, 3, 124, 30, o.x - o.width / 2, o.y - i, 124, 30]
                                })
                            }
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                2050: () => {
                    let enemies = []
                    for (let i = 0; i < 10; i++) {
                        enemies.push(enemy(get('plane', {id: 7, scale: 0.6, arsenal: [2], x: (i % 5) * 90 - 180, y: i >= 5 ? -400 : -300, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000))
                    }

                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.y += 2
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                2650: () => {
                    let enemies = []
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => {
                            enemies.push(enemy(get('plane', {id: 11, x: -300, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000))
                        }, i * 2000)
                    }
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.x++
                            enemy.y += 2
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                3050: () => {
                    let enemies = []
                    for (let i = 0; i < 10; i++) {
                        enemies.push(enemy(get('plane', {id: 9, scale: 0.3, x: (i % 5) * 90 - 180, y: i >= 5 ? -500 : -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000))
                    }
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.y += 2
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                3750: () => {
                    let enemies = [
                        enemy(get('plane', {id: 11, x: -164, y: -500, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 11, x: -82, y: -450, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 11, x: 0, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 11, x: 82, y: -450, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                        enemy(get('plane', {id: 11, x: 164, y: -500, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000),
                    ]
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.move()
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                4150: () => {
                    let enemies = []
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => {
                            enemies.push(enemy(get('plane', {id: 11, x: 300, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000))
                        }, i * 2000)
                    }

                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.x -= 2
                            enemy.y += 4
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                4500: () => {
                    let enemies = []
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => {
                            enemies.push(enemy(get('plane', {id: 11, x: -300, y: -400, direction: 1, rotateDeg: 180})).weaponSystem.continuousShoot(2000))
                        }, i * 2000)
                    }
                    let fn = () => {
                        _.forEach(enemies, (enemy) => {
                            enemy.x += 2
                            enemy.y += 4
                            if (enemy.y >= 400) {
                                enemy.remove()
                            }
                        })
                    }
                    allDie(enemies, () => remove(fn))
                    draw(fn)
                },
                4900: () => {
                    let boss = enemy(get('plane', {
                        id: 5, hp: 8000, hoBar: true, x: 0, y: -400, direction: 1, rotateDeg: 180,
                        collisionArea: [{
                            x: 12,
                            y: 46,
                            width: 179,
                            height: 107,
                        }]
                    })).weaponSystem.continuousShoot()

                    boss.one('y<-300', () => {
                        boss.weaponSystem.add(Weapon.type.get(1, {attackTime: 1500}))
                    })
                    boss.one('4s', () => {
                        boss.weaponSystem.add(Weapon.type.get(3))
                    })
                    let boo = true
                    let fn = () => {
                        if (boss.y < -this.height / 2 + boss.height / 2) {
                            boss.y++
                            this.brushSystem.drawImage('src/img/info/warn.png', ({width, height}) => {
                                return [0, 0, width, height, -width / 2, -height / 2, width, height]
                            })
                        } else {
                            if (boss.x < -100) {
                                boo = false
                            }
                            if (boss.x > 100) {
                                boo = true
                            }

                            boss.x = boo ? boss.x - 2 : boss.x + 2

                            boss.emit('y<-300')
                        }

                        setTimeout(() => {
                            boss.emit('4s')
                        }, 2000)
                        if (boss.y >= 400) {
                            boss.remove()
                        }
                    }
                    allDie([boss], () => {
                        remove(fn)
                        setTimeout(() => {
                            alert('\n  恭喜你通关了！ \n')
                            //刷新页面
                            history.go(0)
                        }, 1000)
                    })
                    draw(fn)
                },
            },
        ]

        let levelFn = () => {
            let distance = this.backgroundScrollSystem.distance
            let gameLevel = Level[lv] === undefined ? null : Level[lv][distance]
            gameLevel && gameLevel()
        }

        let levelSystem = {
            status: 'stop',
            lv: lv,
            start: () => {
                if (levelSystem.status === 'stop') {
                    Brush.render.add(levelFn)
                    levelSystem.status === 'start'
                }
            },
            stop: () => {
                if (levelSystem.status === 'start') {
                    Brush.render.remove(levelFn)
                    levelSystem.status === 'stop'
                }
            },
            //  关卡(第几关), 距离(飞行多长距离) , 执行函数
            setLevel: (level, distance, callback) => {

            },
        }
        return levelSystem

    }
}

export default Game