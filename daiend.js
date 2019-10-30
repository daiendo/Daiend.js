//daiend版微型jQuery 1.0

//为解决浏览器基本兼容问题，以及简洁的操作DOM文档
    //（兼容：主要IE6及以上兼容、火狐等兼容问题）
    //（操作DOM：简洁操作及链式操作）
//实现过程为：以函数自执行，将window与document传入其作用域。实现daiend库，并且将daiend挂载到window上。（仿写jQuery）

//自执行函数参数：window，document。

(function(window,document,undefined){

    //1、兼容部分（使得在IE6及以上document对象具有相应的方法）

        //兼容IE6、7、8不支持的document.getElementsByClassName
        if(!document.getElementsByClassName){
            document.getElementsByClassName = function(eleName){
                var eleArr =[];//存放筛选出来classname为eleName的标签元素，最终返回出去
                //获取所有dom元素
                var domEle = document.all ? document.all : document.getElementsByTagName('*')
                //创建正则表达式，用以匹配eleName
                var reg = new RegExp('\\b'+eleName+'\\b')
                //匹配eleName类名元素
                for(var i = 0;i<domEle.length;i++){
                    if(reg.test(domEle[i].className)){
                        eleArr.push(domEle[i])
                    }
                }
                return eleArr;
            }
        }

    

        //兼容IE6、7、8不支持的js原生方法trim()
        if(!String.prototype.trim){
            String.prototype.trim = function(){
                return this.replace(/^\s+|\s+$/g,"");
            }
        }

    //2、Daiend库实现


        //Daiend库私有方法和私有属性

            //储存domDeady的回调函数
            var  domReadyEventFn = [];
            //储存事件函数(将节点相对应的事件类型、事件源、事件函数存储在节点events对象中)
            var _EventFn = function(eventObj){//参数eventObj的格式示例{domNode:div,type:click,agentFn:fn,originString:"click.stop"}
                //如果节点（domNode）的events对象不存在，则创建events对象，（即还没有存储过）
                
                if(typeof eventObj.domNode.events === "undefined"){
                    eventObj.domNode.events = {};
                    eventObj.domNode.events[eventObj.type] = [eventObj.agentFn]//以对象的方式存入
                    
                }else if(eventObj.domNode.events[eventObj.type] instanceof Array){
                   
                    eventObj.domNode.events.push(eventObj.agentFn)
                }else{
                    eventObj.domNode.events[eventObj.type] = [eventObj.agentFn]
                }
                eventObj.domNode[eventObj.type].originString = eventObj.originString;//存储用户输入事件原始字符串参数
            }

            //用于处理事件的修饰符/事件的指令
            var _eventModifiers = function(modifiersArr,event){
                Daiend.Each(modifiersArr,function(key,index){
                    if(key === "stop"){//阻止冒泡
                        if(event.stopPropagation){
                            event.stopPropagation()
                        }else{
                            event.cancelBubble = true;//兼容IE
                        }
                    }else if(key === "prevent"){
                        if(event.preventDefault){
                            event.preventDefault()
                        }else{
                            event.returnValue = false;//兼容IE
                        }
                    }
                })
            }

            //用于解绑事件及事件函数
            var _removeEventFn = function(domNode,type,eventFn){
                if(domNode.removeEventListener){
                    domNode.removeEventListener(type,eventFn)
                }else if(domNode.detachEvent){
                    domNode.detachEvent("on" + type,eventFn)//IE解绑事件函数
                }

            }

        //定义库
            var Daiend = function(str){
                if(typeof str === "function"){
                    domReadyEventFn.push(str)
                }else{
                    return new Daiend.prototype.init(str)
                }
            }

        //Daiend库静态属性和方法

            //类数组转数组方法
            Daiend.toArray = function(classArr){
                return Array.prototype.slice.call(classArr)
            }
            //Each遍历方法
            Daiend.Each = function(obj,fn,that){
                for(var i=0,len=obj.length;i<len;i++){
                    var flag = fn.call(that || obj[i],obj[i],i,obj)
                    if(flag === false){
                        break;
                    }else if(flag === true){
                        continue;
                    }
                }
            }
            //判断对象类型（type）的方法
            Daiend.type = function(obj){
                var _toString = Object.prototype.toString
                var _type = {//对象可能具有的类型
                    "undefined": "undefined",
                    "number": "number",
                    "boolean": "boolean",
                    "string":"string",
                    "[object Array]": "array",
                    "[object Function]": "function",
                    "[object RegExp]": "reg",
                    "[object Math]": "math",
                    "[object Date]": "date",
                    "[object Error]": "error"
                }
                return _type[typeof obj] || _type[_toString.call(obj)] || (obj ? "object" : "null")
            }


            //实现Daiend库主要功能，放置在Daiend函数的原型中

            Daiend.prototype = {
                constructor: Daiend,//因为覆盖了原有的原型对象，重新使其constructor指针指向构造函数Daiend
                prevNode: null,//用于存储一次性节点

                //初始化函数：Daiend包装对象的生成类（构造函数）
                init: function (select){
                    function judgingParameterType(select){//判断Daiend库使用时传入的参数类型（结构）：html,css,id,classNme,tagName
                        if(/^</.test(select)){//参数为html结构
                            return "html"
                        }else if(/[~+>\s]/.test(select)){
                            return "css"
                        }else if(/^\./.test(select)){
                             return "className"
                        }else if(/^#/.test(select)){
                            return "id"
                        }else if(/^[\w]+$/.test(select)){
                            return "tagName"
                        }
                     }
                    var parameterType = {//不同获取参数进行的不同获取元素的操作
                        html: function(select){
                            var divEle = document.createElement("div")
                            divEle.innerHTML = select
                            return divEle.children
                        },
                        css: function(select){
                            return document.querySelectorAll(select)
                        },
                        id: function(select){
                            var ele = document.getElementById(select.slice(1))//截去#
                            return ele === null ? [] : [ele]
                        },
                        className: function(select){
                            return document.getElementsByClassName(select.slice(1))//截去点（.）
                        },
                        tagName: function(select){
                            return document.getElementsByTagName(select)
                        }
                    }
                    var resultArr;
                    if(typeof select === "object"){
                        resultArr = [select]
                    }else if(typeof select === "string"){
                        resultArr = parameterType[judgingParameterType(select)](select)//获取的元素类数组集合
                    }
                    
                   Daiend.Each(resultArr,function(value,index){
                        this[index] = value
                   },this) //在使用Daiend库时会new执行init函数，即这里的this指向init实例
                   this.length = resultArr.length
                   return this;
                },

                //绑定事件
                on: function(eventType,eventFn){
                    var eventArr = eventType.split(/\./)//将事件修饰符分割出来
                    var type = eventArr.shift();//弹出事件类型
                    
                    if(arguments.length === 0)return;//on方法无参数时return
                    for(var i=0,len=this.length;i<len;i++){//this为调用on方法的对象
                        (function(i){//将i传入自执行函数，且用call方法降this传入此局部作用域
                            var that = this[i]
                            if(type === "mousewheel"){//处理事件为滚轮事件时的情况
                                var fn = function(event){//真正用户事件函数的代理函数
                                    _eventModifiers(eventArr,event)
                                    event.wheelD = event.wheelDelta / 120 || event.detail /-3;//兼容火狐滚轮事件
                                    eventFn.call(that,event)//将当前this和事件对象传入用户事件函数
                                }
                                fn.eventFn = eventFn;//将用户事件函数挂在到fn函数上
                                if(that.addEventListener){//绑定事件
                                    that.addEventListener(
                                        that.onmousewheel === null ? "mousewheel" : "DOMMouseScroll",fn,false
                                    );
                                }else if(that.attachEvent){
                                    that.attachEvent("on"+ type,fn)
                                }
                            }else{//处理不是滚轮事件的其他事件
                                var fn = function(event){
                                    _eventModifiers(eventArr,event)
                                    eventFn.call(that,event)
                                }
                                fn.eventFn = eventFn;
                                if(that.addEventListener){
                                    that.addEventListener(type,fn,false)
                                }else if(that.attachEvent){
                                    that.attachEvent("on"+ type,fn)
                                }
                            }
                            //调用私有方法存储事件的事件函数，以便后期解绑使用
                            _EventFn({
                                domNode:that,
                                type:type,
                                agentFn:fn,
                                originString:eventType
                            })
                        }).call(this,i)
                    }
                    return this;
                },

                //解绑事件
                off:function(eventType,eventFn){
                    if(arguments.length <= 0)return;
                    var isFn = typeof eventFn === "function";
                    for(var i = 0,len=this.length;i<len;i++){
                        var domNodeFnArr = this[i].events[eventType]
                        
                       
                        var that = this[i]
                        if(!domNodeFnArr)return;//若节点存储事件函数的数组为空则return
                        for(var j = domNodeFnArr.length - 1;j>=0;j--){//遍历事件存储的事件函数，逐一解绑
                            if(eventType === "mousewheel"){//解绑事件为滚轮事件的事件函数
                                if(isFn){//用户传入第二个参数为函数
                                    if(domNodeFnArr[j].fn === eventFn){//如果用户传入的事件函数等于已存储的事件函数
                                        _removeEventFn(
                                            that,
                                            that.onmousewheel === null ? "mousewheel" : "DOMMouseScroll",
                                            domNodeFnArr[j]
                                        )
                                    }
                                }else{//用户没有传入第二个参数不是事件函数
                                    _removeEventFn(
                                        that,
                                        that.onmousewheel === null ? "mousewheel" : "DOMMouseScroll",
                                        domNodeFnArr[j]
                                    )
                                }
                            }else{//其他事件
                                
                                if(isFn){
                                    if(domNodeFnArr[j].fn === eventFn){
                                        _removeEventFn(
                                            that,
                                            eventType,
                                            domNodeFnArr[j]
                                        )
                                    }
                                }else{
                                    
                                    _removeEventFn(
                                        that,
                                        eventType,
                                        domNodeFnArr[j]
                                    )
                                }
                            }
                            domNodeFnArr.splice(j,1)
                        }    
                    }
                    return this;
                },

                
                //Daiend包装对象（实例化对象）的遍历方法
                each:function(fn){
                    Daiend.Each(this,function(value,index,targetArr){
                        var flag = fn.call(value,value,index,targetArr)
                        if(flag !== "undefined"){
                            return flag;
                        }
                    })
                },

                //获取或获取表单value
                val: function(str){
                    if(Daiend.type(str) === "undefined"){//当没有参数时，为获取第一个表单的value
                        try{
                            var val = this[0].value
                        }catch(error){
                            throw Error("只有表单对象才能获取value")
                        }
                        return val;
                    }else{//有参数为设置value属性
                        this.each(function(key,index){
                            key.value = str;
                        })
                        return this;
                    }
                },

                //获取或设置HTML内容
                html: function(htm){
                    if(Daiend.type(htm) === "undefined"){
                        try{
                            var html = this[0].innerHTML
                        }catch(error){
                            throw Error("对象的innerHTML不存在")
                        }
                        return html;
                    }else{
                        this.each(function(key,index){
                            key.innerHTML = htm
                        })
                        return this;
                    }
                },

                //获取或设置text
                text: function(tex){
                    if(Daiend.type(tex === "undefined")){
                        try {
                            var text = this[0].innerText;
                        } catch (error) {
                            throw Error("对象的innerText不存在")
                        }
                        return text;
                    }else{
                        this.each(function(key,index){
                            key.innerText = tex;
                        })
                        return this;
                    }
                },

                //帅选对象，返回被Daiend包装的对象
                eq:function(num){//从0开始筛选
                    var len = this.length
                    num = num % len
                    if(num <0){
                        num +=len
                    }
                    Daiend.prototype.prevNode = new this.init(this);
                    console.log(Daiend.prototype.prevNode)
                    return new this.init(this[num]);
                },


                //添加className
                addClass:function(className){
                    this.each(function(){
                        var classArr = this.className.split(/\s/g).concat(className.split(/\s/g))
                        var len = classArr.length
                        for(var i = 0;i<len;i++){
                            for(var j=len -1;j>i;j--){
                                if(!classArr[j]){
                                    classArr.splice(j,1)
                                };
                                if(classArr[i] === classArr[j]){
                                    classArr.splice(j,1)
                                }
                            }
                        }
                        this.className = classArr.join(" ")
                    })
                    return this;
                },

                //删除className
                removeClass:function(className){
                    this.each(function(){
                        var oldClass = this.className.split(/\s/g)
                        var newClass = className.split(/\s/g)
                        for(var i =0;i<newClass.length;i++){
                            for(var j=oldClass.length-1;j>=0;j--){
                                if(newClass[i] === oldClass[j]){
                                    oldClass.splice(j,1)
                                }
                            }
                        }
                        this.className = oldClass.join(" ")
                    })
                    return this;
                },

                //判断是否有类名
                hasClass:function(className){
                    var reg = new RegExp("\\b"+className + "\\b");
                    return reg.test(this[0].className)
                },
                //存在则删除，不存在则添加

                toggleClass:function(className){
                    this.each(function(){
                        var that =Daiend(this)
                        if(that.hasClass(className)){
                            that.removeClass(className)
                        }else{
                            that.addClass(className)
                        }
                    })
                    return this;
                },
                //在当前添加到参数结构中
                appendTo:function(select){
                    if(select instanceof Daiend){
                        var obj = select
                    }else{
                        var obj = Daiend(select)
                       
                    }
                    var event = []
                    var target = this
                    Daiend.Each(obj,function(key,index){//遍历并appendTo
                        var node = target[0].cloneNode(true)
                        event.push(node)
                        key.appendChild(node)
                    })
                    //将源节点拥有的事件遍历绑定到克隆节点上
                    for(var key in target[0].events){//key为事件类型
                        Daiend.Each(event,function(node){
                            Daiend.Each(target[0].events[key],function(valueFn){
                                Daiend(node).on(target[0].events[key].originString,valueFn)
                            })
                        })
                    }
                    return this;
                },
              
               

                remove:function(select){
                    var type = Daiend.type(select)
                    if(type === "undefined"){
                        this.each(function(){
                            this.innerHTML = ""
                        })
                    }else if(type = "string"){
                        var obj = Daiend(select)
                        this.each(function(key){
                            obj.each(function(value){
                                value.parentNode === key && key.removeChild(value)
                            })
                        })
                    }else if(type === "object"){
                        if(select instanceof Daiend){
                            this.each(function(key){
                                select.each(function(value){
                                    value.parentNode === key && key.removeChild(value)
                                })
                            })
                        }else{
                            if(select.length !== undefined){
                                this.each(function(key){
                                    for(var i = select.length-1;i>=0;i--){
                                        select[i].parentNode == key && key.removeChild(select[i])
                                    }
                                })
                            }else{
                                this.each(function(key){
                                    select.parentNode === key && key.removeChild(select)
                                })
                            }
                        }
                    }
                    return this;
                },

                css:function(cssName,value){//若第二个参数不存在则为获取
                    var type = Daiend.type(cssName)
                    var helpStr = ""
                    if(type === "string"){
                        if(!!value){
                            if(/width|height|top|right|bottom|left/i.test(cssName)){
                                !isNaN(value / 1) && (helpStr = "px")
                            }
                            this.each(function(){
                                this.style[cssName] = value + helpStr;
                            })
                        }else{
                            if(window.getComputedStyle){
                                return getComputedStyle(this[0])[cssName]
                            }else{
                                return this[0].currentStyle[cssName]
                            }
                        }
                    }else if(type === "object"){
                        for(var key in cssName){
                            this.css(key,cssName[key])
                        }
                    }
                    return this;
                },
                //操作自定义属性，也可操作原生属性
                attr:function(attrName,value){
                    var type = Daiend.type(attrName)
                    if(type === "string"){
                        if(Daiend.type(value) !== "undefined"){
                            this.each(function(){
                                this.setAttribute(attrName,value)
                            })
                        }else{
                            this.each(function(){
                            return this.getAttribute(attrName)
                            }) 
                        }
                    }else if(type === "object"){
                        for(var key in attrName){
                            this.attr(key,attrName[key])
                        }
                    }
                    return this;
                },
                //操作原生属性
                prop:function(propertyName,value){
                    var type = Daiend.type(propertyName)
                    if(type ===  "string"){
                        if(Daiend.type(value) !== "undefined"){
                            this.each(function(){
                                this[propertyName] = value;
                            })
                        }else{
                            this.each(function(){
                            return this[0][propertyName]
                            })
                        }
                    }else if(type === "obiect"){
                        for(var key in propertyName){
                            this.prop(key,propertyName[key])
                        }
                    }
                    return this;
                },

                removeAttr: function(attrName){
                    var type = Daiend.type(attrName)
                    if(type === "undefinded")return;
                    var arr = attrName.split(/\s/g);
                    this.each(function(key){
                        Daiend.Each(arr,function(value){
                            key.removeAttribute(value)
                        })
                    })
                    return this;
                },
                
            }
            Daiend.prototype.init.prototype = Daiend.prototype;

            //domready
            ;(function(window,document){
                var done = false //表明domready是完成并且回调都已经执行过了
                var init = function(){
                    if(!done){
                        done = true;
                        Daiend.Each(domReadyEventFn,function(){
                            this(Daiend)
                        })
                        domReadyEventFn.length = 0;
                    }
                };
                // Daiend(document).one("DOMContentLoaded",init)

                fn();
                function fn(){
                    try {
                        document.documentElement.doScroll("left")
                    } catch (error) {
                        setTimeout(fn)
                        return;
                    }
                    init();
                }
                document.onreadystatechange = function(){
                    if(document.readyState === "complete"){
                        document.onreadystatechange = null;
                        init()
                    }
                }
                window.onload = function(){
                    window.onload = null;
                    init();
                }
            })(window,document)
            //nick 自定义使用库名
            ;(function(){
                Daiend("script").each(function(){
                    var val = this.getAttribute("nick");
                    if(val){
                        window[val] = Daiend;
                    }
                })
            })()

            window.$ = Daiend;
})(window,document);
