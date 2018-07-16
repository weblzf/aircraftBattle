import Game from './Game.js'
import _ from './_.js'
import Plane from './Plane.js'
import dom from './dom.js'
import loading from './Loading.js'

import '../css/index.css'
import '../img/background/bg1_2.png'
import '../img/bullet/bullet.png'
import '../img/bullet/laser.png'
import '../img/plane/hit.png'
import '../img/plane/plane_0.png'
import '../img/plane/plane_1.png'
import '../img/plane/plane_2.png'
import '../img/plane/plane_3.png'
import '../img/plane/plane_4.png'
import '../img/plane/plane_5.png'
import '../img/plane/plane_6.png'
import '../img/plane/plane_7.png'
import '../img/plane/plane_8.png'
import '../img/plane/plane_9.png'
import '../img/plane/plane_10.png'
import '../img/plane/plane_11.png'
import '../img/plane/plane_12.png'
import '../img/plane/plane_13.png'
import '../img/plane/plane_14.png'
import '../img/info/other_drop/weapon_upgrades.png'
import '../img/plane/hpBar/enemy_blood_none.png'
import '../img/plane/hpBar/enemy_blood_full.png'
import '../img/info/info.png'
import '../img/info/warn.png'

window.addEventListener('DOMContentLoaded', () => {

    let progress = document.querySelector('.progress')
    loading([
        'src/img/background/bg1_2.png',
        'src/img/bullet/bullet.png',
        'src/img/bullet/laser.png',
        'src/img/plane/hit.png',
        'src/img/plane/plane_0.png',
        'src/img/plane/plane_1.png',
        'src/img/plane/plane_2.png',
        'src/img/plane/plane_3.png',
        'src/img/plane/plane_4.png',
        'src/img/plane/plane_5.png',
        'src/img/plane/plane_6.png',
        'src/img/plane/plane_7.png',
        'src/img/plane/plane_8.png',
        'src/img/plane/plane_9.png',
        'src/img/plane/plane_10.png',
        'src/img/plane/plane_11.png',
        'src/img/plane/plane_12.png',
        'src/img/plane/plane_13.png',
        'src/img/plane/plane_14.png',
        'src/img/info/other_drop/weapon_upgrades.png',
        'src/img/plane/hpBar/enemy_blood_none.png',
        'src/img/plane/hpBar/enemy_blood_full.png',
        'src/img/info/info.png',
        'src/img/info/warn.png',
    ], progress, () => {
        let loading = document.querySelector('#loading')
        loading.parentNode.removeChild(loading)

        let type = 0
        let menu = document.querySelector('#menu')
        let allType = document.querySelectorAll('.planeType li')
        let start = document.querySelector('.start')

        menu.style.display = 'block'
        dom.on(menu, 'click', 'li img', function (e) {
            _.forEach(allType, (node) => node.classList.remove('active'))
            this.parentNode.classList.add('active')
            type = this.dataset.type
        })

        start.addEventListener('click', gameStart)
        start.addEventListener('touchstart', gameStart)

        let game = new Game({
            width: 414,
            height: 736,
            canvas: document.getElementById('game'),
            backgroundScroll: {
                node: document.getElementById('background'),
                img: {
                    src: 'src/img/background/bg1_2.png',
                },
                speed: 1,
            },
            origin: 'center'
        })
        game.canvas.style.cssText = `position: fixed;top: 50%; left: 50%; transform: translate(-50%, -50%) scale(${ window.innerWidth / 414 },${  window.innerHeight / 736})`

        let _start = false

        function gameStart(e) {
            if (_start) {
                return
            }
            _start = true
            menu.style.display = 'none'
            let n = 82 / (Plane.type.get(Number(type)).width)
            let my = _.assign(Plane.type.get(type, n), {
                direction: 0,
                rotateDeg: 180,
                x: 0,
                y: 300,
                arsenal: [0],
                hpBar: true,
                hp: 720,
            })
            my = game.planeSystem.createPlayer(my)
            my.weaponSystem.continuousShoot()

            game.start()

            my.on('die', () => {
                setTimeout(() => {
                    alert('这么简单游戏，不应该过不去啊。\n重新来过吧！')
                    history.go(0)
                }, 1000)
                //刷新页面
            })
            window.my = my
            window.game = game
        }
    })
})
