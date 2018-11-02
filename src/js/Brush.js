//画笔
import _ from './_.js'

class Brush {
    constructor(options) {
        this.checkOptions(options)

        let defaultOptions = {
            //canvas节点
            canvas: null,
            //上下文类型
            contextType: '2d',
            //宽 默认窗口大小
            width: window.innerWidth,
            //高
            height: window.innerHeight,
        }

        _.assign(this, defaultOptions, options)

        this.init()
    }

    //检测选项
    checkOptions(options) {
        if (options.canvas.nodeName !== 'CANVAS') {
            throw new Error('Does not provide the correct canvas node!')
        }
        return this
    }

    init() {
        this.canvas.width = this.width
        this.canvas.height = this.height
        this.ctx = this.canvas.getContext(this.contextType)
        _.defineSetAndGet(this, 'width', (newVal) => {
            this.canvas.width = this.width
            return newVal
        })
        _.defineSetAndGet(this, 'height', (newVal) => {
            this.canvas.height = this.height
            return newVal
        })
    }

    // 参数遵循原api
    // 若arg只写函数 函数会传入 一个 图像对象  且将函数返回值视为绘图参数
    drawImage(src, ...arg) {
        let ctx = this.ctx
        let callback = typeof arg[0] === 'function' ? arg[0] : null

        if (Brush[src]) {
            startDraw(Brush[src])
        } else {
            let img = new Image()
            img.src = src
            img.onload = () => {
                Brush[src] = img
                //绘画
                startDraw(img)
                //删除
                img.onload = null
            }
            img.error = () => {
                console.log('超时')
            }
        }

        //绘画
        function startDraw(img) {
            if (callback) {
                //若是回调函数, arg为回调的返回值
                arg = callback({
                    width: img.width,
                    height: img.height,
                })
            }
            //优化
            arg = _.map(arg, (val) => {
                return Math.round(val)
            })
            ctx.drawImage(img, ...arg)
        }

        return this
    }

    //获取context
    getContext() {
        return this.ctx
    }

    //旋转   输入角度 旋转点
    rotate({x, y, deg}) {
        let ctx = this.ctx
        ctx.translate(x, y)
        ctx.rotate(deg * Math.PI / 180)
        ctx.translate(-x, -y)
        return this
    }

    //移动
    translate({x, y}) {
        let ctx = this.ctx
        ctx.translate(x, y)
        return this
    }

    rect({x, y, width, height, style = 'fill', color = '#000', globalAlpha = 1,}) {
        let ctx = this.ctx
        ctx.globalAlpha = globalAlpha
        ctx[style + 'Style'] = color
        ctx[style + 'Rect'](x, y, width, height)
        return this
    }

    //矩形
    fillRect({x, y, width, height, color, globalAlpha = 1,}) {
        this.rect({x, y, width, height, style: 'fill', color, globalAlpha})
        return this;
    }

    //描边
    strokeRect({x, y, width, height, color, globalAlpha = 1,}) {
        this.rect({x, y, width, height, style: 'stroke', color, globalAlpha})
        return this
    }

    //一次 无影响操作
    noEffect(fn) {
        let ctx = this.ctx
        ctx.save()
        fn && fn()
        ctx.restore()
        return this
    }

    //清除
    clear(...arg) {
        let ctx = this.ctx
        if (arg.length === 0) {
            let {width, height} = this
            let origin = this.origin === 'center' ? {x: -width / 2, y: -height / 2,} : {x: 0, y: 0,}
            arg = [origin.x, origin.y, width, height]
        }

        ctx.clearRect(...arg)
        return this
    }

    //获取图像信息
    getImageData(position) {
        if (this.options.origin === 'center') {
            let view = {
                width: window.innerWidth,
                height: window.innerHeight,
            };
            position.x += view.width;
            position.y += view.height;
        }
        return this.ctx.getImageData(position);
    }
}

Brush.data = {}
Brush.render = (function () {
    let allRenderCallback = []
    let timer = null
    let render = {
        status: 'stop',
        add(callback) {
            if (typeof callback !== 'function') {
                throw new Error('callback must is function')
            }
            allRenderCallback.push(callback)
            if (Brush.render.status === 'stop') {
                Brush.render.start()
            }
        },
        remove(callback) {
            if (typeof callback === 'function') {

                //_,remove 第二个参数 如果是函数 会当做判断函数执行
                _.remove(allRenderCallback, (fn) => fn === callback)
            } else {
                throw new Error('callback must is function')
            }
        },
        removeAll() {
            _.forEach(allRenderCallback, (callback) => {
                render.remove(callback)
            })
        },
        start() {
            function frameFn() {
                _.forEach(allRenderCallback, (callback) => callback && callback())

                timer = requestAnimationFrame(frameFn)
                if (allRenderCallback.length === 0) {
                    render.stop()
                }
            }

            if (Brush.render.status === 'stop') {
                timer = requestAnimationFrame(frameFn)
                Brush.render.status = 'start'
            }
        },
        stop() {
            cancelAnimationFrame(timer);
            Brush.render.status = 'stop'
        },
        show() {
            console.log(allRenderCallback);
        }
    }
    return render
})()
export default Brush

