import _ from './_.js'
import Brush from './Brush.js'

function loading(srcArray, node, callback) {
    let list = []
    let start = 0
    let i = 0
    let boo = false
    let now = 0
    _.forEach(srcArray, (src) => {
        let img = new Image()
        img.onload = () => {
            i++
            if (i === srcArray.length) {
                list.push(linner.bind(null, start, 100))
                list.push(callback)
            } else {
                list.push(linner.bind(null, start, start += (1 / srcArray.length) * 100))
            }
            Brush.data[src] = img
        }
        img.src = src
    })
    window.onload = () => {
        list.length = 0
        callback()
    }
    list.push = (fn) => {
        if (boo === false) {
            fn()
            boo = true
        }
        return Array.prototype.push.call(list, fn)
    }

    // 0.2s  200     20
    function linner(a, b) {
        let portion = (b - a) / 10
        let timer = setInterval(() => {
            a += portion
            a = a >= b ? b : a
            now = a
            node.textContent = Number(a).toFixed(0)
            if (a >= b) {
                clearInterval(timer)
                list.shift()
                list[0] && list[0]()
            }
        }, 20)
    }
}

export default loading