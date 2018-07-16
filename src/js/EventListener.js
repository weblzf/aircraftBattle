import _ from './_.js'

class EventListener {
    constructor() {
        this._events = {}
        //不可遍历 不可赋值
        Object.defineProperty(this, '_events', {
            enumerable: false,
            writable: false,
        })
    }

    on(type, callback) {
        if (typeof callback !== 'function') {
            throw 'callback must is function'
        }
        if (Array.isArray(this._events[type])) {
            this._events[type].push(callback)
        } else {
            this._events[type] = [callback]
        }
        return callback
    }

    emit(type, ...arg) {
        if (Array.isArray(this._events[type])) {
            _.forEach(this._events[type], (callback) => callback(...arg))
        }
    }

    removeEvent(type, callback) {
        let callbackArray = this._events[type]
        if (Array.isArray(callbackArray) && callbackArray.includes(callback)) {
            let i = callbackArray.indexOf(callback)
            callbackArray.splice(i, 1)
        }
    }

    removeAllEvent(type) {
        if (type === undefined) {
            _.keys(this._events, (key) => {
                delete this._events[key]
            })
        } else if (Array.isArray(this._events[type])) {
            this._events[type] = []
        }
    }

    one(type, callback) {
        let oneFn = (...arg) => {
            callback(arg)
            this.removeEvent(type, oneFn)
        }
        this.on(type, oneFn)
    }
}

export default EventListener