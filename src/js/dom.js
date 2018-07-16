import _ from './_.js'
const dom = {
    on(element, eventType, selector, fn) {
        let eventTypeArr = _.getType(eventType) === 'array' ? eventType : [eventType]
        _.forEach(eventTypeArr, (eventType) => {
            element.addEventListener(eventType, function (e) {
                let el = e.target;
                while (!el.matches(selector)) {
                    if (el === element) {
                        el = null;
                        break;
                    }
                    el = el.parentNode;
                }
                el && fn.call(el, e, el);
            })
        })
    },
    //every
    every(nodeList, fn) {
        for (let i = 0; i < nodeList.length; i++) {
            fn.call(nodeList[i], nodeList[i], i);
        }
        return nodeList;
    },
    //index
    index(element) {
        let siblings = element.parentNode.children;
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i] === element) {
                return i;
            }
        }
        return -1;
    },
    //删除
    remove(element) {
        element.parentNode.removeChild(element);
    },
    //同级元素中独有class名
    uniqueClass(element, className) {
        dom.every(element.parentNode.children, function (el) {
            el.classList.remove(className);
        })
        element.classList.add(className);
        return element;
    },
    //后添加
    append(parent, children) {
        if (children.length === undefined) {
            children = [children];
        }
        for (let i = 0; i < children.length; i++) {
            parent.appendChild(children[i]);
        }
        return parent;
    },
    //前添加  隐患
    prepend(parent, children) {
        if (children.length === undefined) {
            children = [children];
        }
        for (let i = children.length - 1; i >= 0; i--) {
            if (parent.firstchild) {
                parent.insertBefore(children[i], parent.firstchild)
            } else {
                parent.appendChild(children[i]);
            }
        }
    },
    $(...arg) {
        if (arg.length === 1) {
            let selector = arg[0];
            return document.querySelector(selector);
        } else {
            let node = arg[0];
            let selector = arg[1];
            return node.querySelector(selector);
        }
    },
    $$(...arg) {
        if (arg.length === 1) {
            let selector = arg[0];
            return document.querySelectorAll(selector);
        } else {
            let node = arg[0];
            let selector = arg[1];
            return node.querySelectorAll(selector);
        }
    },
    style(element, style) {
        if (window.getComputedStyle) {
            return window.getComputedStyle(element, null)[style];
        } else {
            return element.currentStyle[style];
        }
    },
}

if (!Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function (s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {
            }
            return i > -1;
        };
}

export default dom