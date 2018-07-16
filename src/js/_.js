const _ = {
    // 大多数函数 不提供this值 个人觉得滥用this使代码难以阅读
    forEach(array, callback) {
        let len = array.length
        if (typeof len !== 'number') {
            throw new Error('The traversal object is not provided')
        }
        for (let i = 0; i < len; i++) {
            callback(array[i], i, array)
        }
        return this
    },
    lastForEach(array, callback) {
        let len = array.length
        if (typeof len !== 'number') {
            throw new Error('The traversal object is not provided')
        }
        for (let i = len - 1; i >= 0; i--) {
            callback(array[i], i, array)
        }
        return this
    },
    map(array, callback) {
        let newArray = []
        _.forEach(array, (...arg) => {
            newArray.push(callback(...arg))
        })
        return newArray
    },
    reduce(array, callback, initVal) {
        let i = 0
        let len = array.length
        if (typeof len !== 'number') {
            throw new Error('The traversal object is not provided')
        }
        if (initVal === undefined) {
            i = 1
            initVal = array[0]
        }
        for (; i < len; i++) {
            initVal = callback(initVal, array[i], array)
        }
        return initVal
    },
    filter(array, callback) {
        let newArray = []
        _.forEach(array, (...arg) => {
            if (callback(...arg)) {
                newArray.push(arg[0])
            }
        })
        return newArray
    },
    // 在原数组中删除
    // 函数返回true则删除
    // 返回值  由被删的值组成的数组
    remove(array, value) {
        let beDeletedArray = []
        let checkFn

        if (typeof value === 'function') {
            checkFn = value
        } else {
            checkFn = (item) => item === value
        }

        _.lastForEach(array, (item, i, arr) => {
            if (checkFn(item, i, arr)) {
                array.splice(i, 1)
                beDeletedArray.unshift(item)
            }
        })

        return beDeletedArray
    },
    //callback 提供一个参数 img对象
    loadImg(src, callback) {
        let img = new Image()
        img.onload = () => {
            callback(img)
            img.onload = null
        }
        img.src = src
    },
    find(array, callback) {
        let len = array.length
        if (typeof len !== 'number') {
            throw new Error('The traversal object is not provided')
        }
        for (let i = 0; i < len; i++) {
            return callback(array[i], i, array)
        }
    },
    //深赋值  (循环引用问题未解决)
    deepAssign(target, ...sources) {
        // return Object.assign(target,...sources)
        let targetType = _.getType(target)
        //既不是对象也不是数组
        if (targetType !== 'object' && targetType !== 'array') {
            throw new Error('sources value must is object')
        }

        _.forEach(sources, (val) => {
            assign(target, val)
        })

        function assign(obj, origin) {
            let originType = _.getType(origin)
            if (originType !== 'object' && originType !== 'array') {
                return obj
            }
            for (let key in origin) {
                if (origin.hasOwnProperty(key)) {
                    let nowVal = obj[key]
                    let newVal = origin[key]
                    let nowValType = _.getType(nowVal)
                    let newValType = _.getType(newVal)

                    if (newValType === 'object' || newValType === 'array') {
                        if (nowValType === newValType) {
                            newVal = assign(nowVal, newVal)
                        } else {
                            newVal = _.deepCopy(newVal)
                        }
                    }
                    obj[key] = newVal
                }
            }
            return obj
        }

        return target
    },
    assign(target, ...sources) {
        let targetType = _.getType(target)
        //既不是对象也不是数组
        if (targetType !== 'object' && targetType !== 'array') {
            throw new Error('sources value must is object')
        }

        _.forEach(sources, (val) => {
            assign(target, val)
        })

        function assign(obj, origin) {
            _.keys(origin, (key) => {
                obj[key] = origin[key]
            })
            return obj
        }

        return target
    },
    //返回详细类型
    getType(target) {
        let str = Object.prototype.toString.call(target)
        let type = str.slice(8, -1).toLowerCase().trim()
        return type
    },
    //简单深拷贝    (循环引用问题未解决)
    deepCopy(source) {
        let type = _.getType(source)
        //不是object 也不是 array  就
        if (type !== 'object' && type !== 'array') {
            return source
        }
        let obj = type === 'array' ? [] : {}


        _.keys(source, (key) => {
            obj[key] = _.deepCopy(source[key])
        })

        return obj
    },
    keys(target, callback) {
        let keys = []
        for (let key in target) {
            if (target.hasOwnProperty(key)) {
                keys.push(key)
                callback && callback.call(target, key, target)
            }
        }
        return keys
    },
    values(target, callback) {
        if (typeof target !== 'object' || target === null) {
            console.log(target);
        }
        let values = []
        for (let key in target) {
            if (target.hasOwnProperty(key)) {
                callback && callback.call(target, target[key], target)
                values.push(target[key])
            }
        }
        return values
    },
    defineSetAndGet(obj, key, set, get) {
        let val = obj[key]
        Object.defineProperty(obj, key, {
            set: (newVal) => {
                if (set) {
                    val = set(newVal, val)
                }
                return val
            },
            get: () => {
                if (get) {
                    return get(val)
                }
                return val
            },
        })
    },
    //矩形碰撞
    //矩形参数:{x:0,y:0,width:100,height:100,rotateDeg:30}
    rectCollision: (function () {
        // 将矩形的 4点坐标求出
        // a —— —— b
        // |       |
        // |       |
        // d —— —— c
        // 只写rotateDeg 矩形以自己为中心旋转
        let getCoordinate = ({x, y, width, height, rotateDeg, rotatePoint = {x: null, y: null}}) => {
            // rotateDeg:30
            let points = {
                a: {
                    x: x,
                    y: y,
                },
                b: {
                    x: x + width,
                    y: y,
                },
                c: {
                    x: x + width,
                    y: y + height,
                },
                d: {
                    x: x,
                    y: y + height,
                },
            }
            if (rotateDeg &&
                rotateDeg !== 0) {
                _.forEach(_.keys(points), (key) => {
                    let point = points[key]
                    points[key] = pointRevolvesAroundThePoint(point, {
                        x: rotatePoint.x || x + width / 2,
                        y: rotatePoint.y || y + height / 2,
                    }, rotateDeg)
                })
            }
            return points
        }

        // 传入矩形coordinate  返回对象  4条边
        // ab bc cd da
        function getRectLine(coordinate) {
            let ab = {
                start: coordinate.a,
                end: coordinate.b,
            }
            let bc = {
                start: coordinate.b,
                end: coordinate.c,
            }
            let cd = {
                start: coordinate.c,
                end: coordinate.d,
            }
            let da = {
                start: coordinate.d,
                end: coordinate.a,
            }
            return {
                ab,
                bc,
                cd,
                da,
            }
        }

        // 判断2条线是否交叉
        // 参数应该为对象 例如：A = {start: {x: 1, y: 1}, end: {x: 1, y: 1}}
        function judgmentLineCross(A, B) {
            // 快速排斥实验
            // max(C.x,D.x)<min(A.x,B.x)或者max(C.y,D.y)<min(A.y,B.y)
            // max(A.x,B.x)<min(C.x,D.x)或者max(A.y,B.y)<min(C.y,D.y)
            // A || Q1 = A.start   B || Q2 = A.end
            // C || P2 = B.start   D || P1 = B.end
            // 有一点为真 两线段必不可交
            if (Math.max(B.start.x, B.end.x) < Math.min(A.start.x, A.end.x) ||
                Math.max(A.start.x, A.end.x) < Math.min(B.start.x, B.end.x) ||
                Math.max(B.start.y, B.end.y) < Math.min(A.start.y, A.end.y) ||
                Math.max(A.start.y, A.end.y) < Math.min(B.start.y, B.end.y)) {
                return false
            }
            //跨立实验  返回true  交叉
            if (straddles(A, B)) {
                return true
            }

            return false
        }

        //向量求和  返回对象
        // P + Q = (P.x + Q.x, P.y + Q.y),
        function vector_Sum(P, Q) {
            return {
                x: P.x + Q.x,
                y: P.y + Q.y,
            }
        }

        //向量求差  返回对象
        //P - Q = (P.x - Q.x, P.y - Q.y)，
        function vector_Subtract(P, Q) {
            return {
                x: P.x - Q.x,
                y: P.y - Q.y,
            }
        }

        //向量相乘  返回值
        //P × Q = P.x * Q.y - P.y * Q.x
        function vector_Multiply(P, Q) {
            return P.x * Q.y - P.y * Q.x
        }

        //跨立实验 传入2个线段 返回true则碰撞
        function straddles(A, B) {
            // Q1 = A.start   Q2 = A.end
            // P1 = B.start   P2 = B.end
            // ( P1 - Q1 ) X ( Q2 - Q1 ) * ( P2 - Q1 ) X ( Q2 - Q1 ) < 0
            // ( Q1 - P1 ) X ( P2 - P1 ) * ( Q2 - P1 ) X ( P2 - P1 ) < 0
            // !!!! 查出的公式两个都应该为 >= 0才碰撞  但是这里我测试是<0才行才碰撞   不懂为什么
            let one = vector_Multiply(
                vector_Subtract(B.start, A.start),
                vector_Subtract(A.end, A.start),
            ) * vector_Multiply(
                vector_Subtract(B.end, A.start),
                vector_Subtract(A.end, A.start),
            )
            let two = vector_Multiply(
                vector_Subtract(A.start, B.start),
                vector_Subtract(B.end, B.start),
            ) * vector_Multiply(
                vector_Subtract(A.end, B.start),
                vector_Subtract(B.end, B.start),
            )
            return one < 0 && two < 0
        }

        //返回 A围绕B旋转deg后的坐标
        let pointRevolvesAroundThePoint = (A, B, deg) => {
            deg = deg * Math.PI / 180
            // newX = (A.x - B.x) * cos(deg) - (A.y - B.y) * sin(deg) + B.x
            // newY = (A.x - B.x) * sin(deg) + (A.y - B.y) * cos(deg) + B.y
            return {
                x: (A.x - B.x) * Math.cos(deg) - (A.y - B.y) * Math.sin(deg) + B.x,
                y: (A.x - B.x) * Math.sin(deg) + (A.y - B.y) * Math.cos(deg) + B.y,
            }
        }

        // 传入 2个 矩形
        // 例如: {x:0,y:0,width:100,height:100,rotateDeg:30}
        let handle = (rectA, rectB) => {
            let A = getRectLine(getCoordinate(rectA))
            let B = getRectLine(getCoordinate(rectB))

            let line_A = _.values(A)
            let line_B = _.values(B)
            //A矩形的 所有边
            for (let i = 0; i < line_A.length; i++) {
                //B矩形的 所有边
                for (let j = 0; j < line_B.length; j++) {
                    //如果有一条边碰撞到
                    if (judgmentLineCross(line_A[i], line_B[j])) {
                        return true
                    }
                }
            }
            return false
        }
        return handle
    })()
}

export default _