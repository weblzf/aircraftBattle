import EventListener from './EventListener.js'
import _ from './_.js'
import Brush from './Brush.js'

class BackgroundScroll extends EventListener {
    constructor(options) {
        super()
        this.checkOptions(options)

        let defaultOptions = {
            node: null,
            speed: 0, //速度
            distance: 0, //滚动了多远
            img: {
                src: '',
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            },
        }

        _.assign(this, defaultOptions, options)

        this.init()
    }

    checkOptions(options) {
        let key = ''
        switch (undefined) {
            case options.img:
                throw new Error('img is undefined')
                break
            case options.node:
                key = 'node'
            case options.speed:
                key = 'speed'
            case options.img.src:
                key = 'img.src'
                throw new Error(`${key} is undefined`)
                break
        }
    }

    init() {
        this.status = 'stop'
        this._scroll = this._scroll.bind(this)
        let style = this.node.style

        _.loadImg(this.img.src, ({width, height}) => {
            style.backgroundImage = `url(${this.img.src})`
            style.backgroundRepeat = 'no-repeat'
            style.width = '100%'
            style.height = '200%'
            style.backgroundSize = '100% 100%'

            this.translateY = this.target = this.distance % (this.node.offsetHeight + 1) - this.node.offsetHeight / 2
            style.transform = `translateY( ${ this.target}px)`
        })
    }

    _scroll() {
        this.distance += this.speed
        this.translateY += this.speed
        this.translateY = this.translateY >= 0 ? this.target : this.translateY
        this.node.style.transform = `translateY( ${ this.translateY}px)`
    }

    start() {
        if (this.status !== 'stop') {
            return
        }
        this.status = 'start'

        Brush.render.add(this._scroll)

        this.emit('start')
    }

    stop() {
        if (this.status !== 'start') {
            return
        }
        this.status = 'stop'

        Brush.render.remove(this._scroll)

        this.emit('stop')
    }
}

export default BackgroundScroll