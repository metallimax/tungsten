/*

Usage comments :
    - asynchronous slots must propagate signals into the handler when action is finished

*/

Array.prototype.indexOf = function(obj) {
    var t = this;
    for(var i=0; i < t.length; i++) {
        if(t[i] == obj) return i;
    }
    
    return -1;
};

Date.prototype.toString = function(format) {
    var that = this;
    var result = format == null ? "dd/mm - hh:ii" : format.toLowerCase();
    
    var mapping = {
        dd: function () {
            return (that.getDate() < 10 ? "0" : "") + that.getDate();
        },
        
        mm: function () {
            return (that.getMonth() < 10 ? "0" : "") + that.getMonth();
        },
        
        hh: function () {
            return (that.getHours() < 10 ? "0" : "") + that.getHours();
        },
        
        ii: function () {
            return (that.getMinutes() < 10 ? "0" : "") + that.getMinutes();
        }
    }
    
    for(var key in mapping) {
        result = result.replace(new RegExp(key, "g"), mapping[key]());
    }
    
    return result;
};


W = function() {
    // ########## private attributes ##########
    
    var elementClassPrefix = "w";
    var elementClassSeparator = "|";
    var elementClassSeparatorAlt = "_";
    
    var eltSplitter = new RegExp("\\" + elementClassSeparator, "g");
    var classSplitter = /[ ]+/g;
    
    var parsed = false;
    
    var defaultHash = "";
    var hash = "";
    
    var hashCheckInterval = 100;
    
    var win = window;
    
    var emptyInput = /^[\s]*$/g
    
    var setOptionsByArray = function(element, options, offset) {
        offset = null == offset ? 0 : offset;
        for(var i=offset; i+1 < options.length; i+=2) {
            element["_" + options[i]] = options[i+1];
        }
    }
    
    var init_params = {
        'window': window
    };
    
    var that = {
        // ########## public methods ##########
        
        init: function (params) {
            // parse document and add properties to elements
            if(null != params) {
                for(param in params) {
                    init_params[param] = params[param];
                }
            }
            
            // that.override(win, "onload", this.onload);
            that.addSlot(init_params.window, "load", that.onload);
            
        },
        
        override: function(object, method, callback) {
            if(null == object._overridden) {
                object._overridden = {};
            }
            
            object._overridden[method] = object[method];
            object[method] = callback;
        },
        
        onload: function() {
            if(!parsed) {
                // PRELOAD
                if(null != init_params.preload) {
                    // TODO implement this
                    console.log('PRELOAD not implemented');
                }
                
                // ANCHOR
                that.addSlot(win, "parseanchoraction", that.defaultParseAnchorAction);
                that.addSlot(win, "anchoraction", that.defaultAnchorAction);
                
                // PARSING
                that.parse(win.document.body);
                
                // ANCHOR CHECK INTERVALL
                setInterval(
                    function() {
                        that.call(null, win, "parseanchoraction");
                    },
                    hashCheckInterval
                );
                
                parsed = true;
                
                // POSTLOAD
                if(null != init_params.postload) {
                    for(var i=0; i < init_params.postload.length; i++) {
                        // TODO manage callback params
                        init_params.postload[i]();
                    }
                }
            }
        },
        
        popup: function(options) {
            // TODO code this to display a popup
        },
        
        error: function(code, message) {
            // TODO code this to display a closable error popup
        },
        
        parse: function(root) {
            // recursive parsing of document elements
            
            try {
                if(null != root.className && "" != root.className) {
                    var classes = root.className.split(classSplitter);
                    for(var i=0; i < classes.length; i++) {
                        var clazz = classes[i]
                        if(0 == clazz.indexOf(elementClassPrefix + elementClassSeparator)) {
                            var classParts = clazz.split(eltSplitter);
                            switch(classParts[1]) {
                                case "slot": {
                                    var callback = win[classParts[3]];
                                    setOptionsByArray(root, classParts, 4);
                                    that.addSlot(root, classParts[2], callback);
                                    break;
                                }
                                
                                case "connect": {
                                    var target;
                                    if("self" == classParts[3]) {
                                        target = root;
                                    }
                                    else if ("window" == classParts[3]) {
                                        target = win;
                                    }
                                    else {
                                        target = win.document.getElementById(classParts[3]);
                                    }
                                    if(null == target) break;
                                    var options = {};
                                    if(classParts.length > 5) {
                                        for(var j=5; j+1 < classParts.length; j+=2) {
                                            options[classParts[j]] = classParts[j+1];
                                        }
                                    }
                                    that.connect(root, classParts[2], target, classParts[4], options);
                                    break;
                                }
                                
                                case "clickable": {
                                    that.addSlot(root, "click", that.defaultClick);
                                    that.addSlot(root, "clicked", null);
                                    that.connect(root, "click", root, "clicked");
                                    break;
                                }
                                
                                case "rolloverable": {
                                    that.addSlot(root, "mouseover", that.defaultMouseOver);
                                    that.addSlot(root, "mouseout", that.defaultMouseOut);
                                    break;
                                }
                                
                                // case "loadable": {
                                    // root._refreshURL = classParts[2];
                                    // new Ajax.Request(root._refreshURL, {
                                        // onSuccess: function(transport) {
                                            // root.innerHTML = transport.responseText;
                                        // }
                                    // });
                                    // break;
                                // }
                                
                                case "intervalable": {
                                    // format : <prefix>|intervalable|<function>|<interval>
                                    root._intervalCallback = init_params.window[classParts[2]];
                                    root._intervalTime = classParts[3];
                                    that.addSlot(root, "interval", that.defaultInterval);
                                    root._interval = setInterval(
                                        function() {
                                            that.call(null, root, "interval");
                                        },
                                        root._intervalTime
                                    );
                                    break;
                                }
                                
                                case "refreshable": {
                                    root._refreshURL = classParts[2];
                                    that.addSlot(root, "refresh", that.defaultRefresh);
                                    that.addSlot(root, "refreshed", null);
                                    if(classParts[3] == "onload") {
                                        that.call(null, root, "refresh");
                                    }
                                    break;
                                }
                                
                                case "updatable": {
                                    // format : <prefix>|updatable|<url>|<timeout>|<xpath>
                                    root._updateURL = classParts[2];
                                    root._updateInterval = parseInt(classParts[3]);
                                    root._updateXPath = classParts[4];
                                    root._updateXPathResult = classParts[5] != null ? classParts[5] : "single";
                                    root._onSuccess = win[classParts[6]];
                                    new Ajax.Updater(root._updateURL, 
                                        {
                                            element: root,
                                            interval: root._updateInterval,
                                            xpath: root._updateXPath,
                                            xpathResult: root._updateXPathResult,
                                            onSuccess: that.defaultSuccessUpdate
                                        }
                                    );
                                    that.addSlot(root, "updated", null);
                                    break;
                                }
                                
                                case "waitable": {
                                    root._waitDelay = parseInt(classParts[2]);
                                    that.addSlot(root, "wait", that.defaultWait);
                                    that.addSlot(root, "unwait", that.defaultUnwait);
                                    that.addSlot(root, "waited", null);
                                    break;
                                }
                                
                                case "fadable": {
                                    that.addSlot(root, "fade", that.defaultFade);
                                    that.addSlot(root, "faded", null);
                                    break;
                                }
                                
                                case "switchable": {
                                    root._switchClass1 = classParts[2];
                                    root._switchClass2 = classParts[3];
                                    that.addSlot(root, "switch", that.defaultSwitch);
                                    that.addSlot(root, "switched", null);
                                    that.connect(root, "switch", root, "switched");
                                    break;
                                }
                                
                                case "xswitchable": {
                                    root._xswitchClass1 = classParts[2];
                                    root._xswitchClass2 = classParts[3];
                                    that.addSlot(root, "xswitch", that.defaultExclusiveSwitch);
                                    that.addSlot(root, "xswitched", null);
                                    that.connect(root, "xswitch", root, "xswitched");
                                    break;
                                }
                                
                                case "asyncform": {
                                    that.addSlot(root, "submit", that.defaultSubmit);
                                    that.addSlot(root, "submited", null);
                                    that.addSlot(root, "reset", function(evt, element){ element.reset(); });
                                    break;
                                }
                                
                                case "validator": {
                                    if(null == root._validators) {
                                        root._validators = [];
                                        that.addSlot(root, "validate", that.defaultValidate);
                                    }
                                    root._validators.push(classParts[2]);
                                    break;
                                }
                            }
                        }
                    }
                    
                    root.className = root.className.replace(eltSplitter, elementClassSeparatorAlt).replace(/[\/\.]/g, elementClassSeparatorAlt);
                }
            }
            catch(e) {
                alert("parse : " + e);
                return;
            }
            
            for(var i=0; i < root.childNodes.length; i++) {
                that.parse(root.childNodes[i]);
            }
        },
        
        setContent: function(node, content) {
            // TODO has to be a method of node ?
            node.innerHTML = content;
            that.parse(node);
        },
        
        isInputEmpty: function(input) {
            var value = input.value;
            
            return value.match(emptyInput);
        },
        
        setDefaultHash: function(dHash) {
            defaultHash = dHash;
        },
        
        call: function(evt, element, type) {
            var func = element["on" + type];
            if(null != func && typeof func == "function") {
                func(evt, element);
            }
        },
        
        setOptions: function(element, options) {
            if(options) {
                for(option in options) {
                    element["_" + option] = options[option];
                }
            }
        },
        
        getElement: function(id, self) {
            var element;
            if("self" == id) {
                element = self;
            }
            else if ("window" == id) {
                element = win;
            }
            else {
                element = win.document.getElementById(id);
            }
            
            return element;
        },
        
        addSource: function(source, sourceType, target, targetType) {
            if(null == target._sources) {
                target._sources = {};
            }
            
            if(null == target._sources[targetType]) {
                target._sources[targetType] = [];
            }
            
            // target._sources[targetType][target._sources[targetType].length] = {type: sourceType, elt: source};
            target._sources[targetType].push({type: sourceType, elt: source});
        },
        
        addTarget: function(source, sourceType, target, targetType, options) {
            if(null == source._targets) {
                source._targets = {};
            }
            
            if(null == source._targets[sourceType]) {
                source._targets[sourceType] = [];
            }
            
            // source._targets[sourceType][source._targets[sourceType].length] = {type: targetType, elt: target, options: options};
            source._targets[sourceType].push({type: targetType, elt: target, options: options});
        },
        
        propagate: function(element, type, evt) {
            try {
                for(var i=0; i < element._targets[type].length; i++) {
                    var target = element._targets[type][i];
                    if(target.options) {
                        for(option in target.options) {
                            target.elt["_" + option] = target.options[option];
                        }
                    }
                    var func = target.elt["on" + target.type];
                    if(null != func && typeof func == "function") {
                        func(evt, target.elt);
                    }
                }
            }
            catch(e){
                // nothing to do here
            }
        },

        connect: function(source, sourceType, target, targetType, options) {
            that.addSource(source, sourceType, target, targetType);
            that.addTarget(source, sourceType, target, targetType, options);
        },

        unconnect: function(source, sourceType, target, targetType) {
            // TODO code this
        },
        
        addSlot: function(element, type, callback) {
            element["on" + type] = function(evt) {
                if(null != callback && typeof callback == "function") {
                    callback(evt, element);
                }
                that.propagate(element, type, evt);
                
                return false;
            };
        },
        
        // ########## DEFAULT COMPORTMENTS ##########
        
        defaultInterval: function(evt, element) {
            element._intervalCallback(evt, element);
            // that.propagate(element, 'interval', evt);
        },
        
        defaultRefresh: function(evt, element) {
            new Ajax.Request(element._refreshURL, {
                onSuccess: function(transport) {
                    element.innerHTML = transport.responseText;
                    // that.propagate(element, "refreshed", evt);
                    // that.call(evt, element, "refreshed");
                }
            });
        },
        
        defaultSuccessUpdate: function(transport, options, res) {
            var func = options.element._onSuccess;
            if(func != null && typeof func == "function") {
                func(null, options.element, res);
            }
            that.propagate(options.element, "updated", null);
        },
        
        defaultWait: function(evt, element, options) {
            element._waitTimeout = win.setTimeout(
            function() {
                element._waitTimeout = null;
                that.propagate(element, "waited", evt);
            },
            element._waitDelay);
        },
        
        defaultUnwait: function(evt, element) {
            if(null != element._waitTimeout) {
                win.clearTimeout(element._waitTimeout);
            }
        },
        
        defaultFade: function(evt, element) {
            // new Ajax.Request(element._refreshURL, {
                // onSuccess: function(transport) {
                    // element.innerHTML = transport.responseText;
                    // that.propagate(element, "refreshed", evt);
                // }
            // });
        },
        
        defaultClick: function(evt, element) {
            // that.propagate(element, "clicked", evt);
            return false;
        },
        
        defaultMouseOver: function(evt, element) {
        },
        
        defaultMouseOut: function(evt, element) {
        },
        
        switchClasses: function(element, class1, class2) {
            var isClass1 = new RegExp(class1, "g");
            var isClass2 = new RegExp(class2, "g");
            
            if(element.className.match(isClass1)) {
                element.className = element.className.replace(isClass1, class2);
            }
            else if(element.className.match(isClass2)) {
                element.className = element.className.replace(isClass2, class1);
            }
        },

        replaceAllClassName: function(toReplace, replacedBy) {
            var elements;
            var hasToReplace = new RegExp(toReplace, "g");
            
            if(win.document.getElementsByClassName) {
                elements = win.document.getElementsByClassName(toReplace);
            }
            else {
                var elements = win.document.getElementsByTagName("*");
            }
            
            for(var i=0; i < elements.length; i++) {
                elements[i].className = elements[i].className.replace(hasToReplace, replacedBy);
            }
        },

        defaultExclusiveSwitch: function(evt, element) {
            // alert("defaultExclusiveSwitch : " + element._targets["xswitched"][0].tagName);
            // alert("defaultExclusiveSwitch : " + element._xswitchClass2 + ', ' + element._xswitchClass1);
            that.replaceAllClassName(element._xswitchClass2, element._xswitchClass1);
            element.className = element.className.replace(new RegExp(element._xswitchClass1, "g"), element._xswitchClass2);
            // that.propagate(element, "xswitched", evt);
        },
        
        defaultSwitch: function(evt, element) {
            that.switchClasses(element, element._switchClass1, element._switchClass2);
            // that.propagate(element, "switched", evt);
        },
        
        defaultParseAnchorAction: function(evt, element) {
            try {
                var newHash = element.location.hash != "" ? element.location.hash.substring(1) : defaultHash;
                if(newHash == hash) return;
                hash = newHash;
                if(0 == hash.indexOf(elementClassPrefix + elementClassSeparator)) {
                    var parts = hash.split(eltSplitter);
                    var options = {};
                    var target = that.getElement(parts[1]);
                    var type = parts[2];
                    for(var i=3; i+1 < parts.length; i+=2) {
                        options[parts[i]] = parts[i+1];
                    }
                    
                    that.setOptions(target, options);
                    that.call(null, target, type);
                }
            }
            catch(e) {
                alert("defaultParseAnchorAction : " + e);
            }
        },
        
        defaultAnchorAction: function(evt, element) {
            var hash = elementClassPrefix + elementClassSeparator + element._target + elementClassSeparator + element._command;
            window.location.hash = "#" + hash;
        },
        
        getInputValue: function(input) {
            return input.value;
        },
        
        defaultSubmit: function(evt, form) {
            var action = form.action;
            var method = form.method.toLowerCase();
            var arguments = {};
            
            try {
                for(var i=0; i < form.elements.length; i++) {
                    var element = form.elements[i];
                    var value = that.getInputValue(element);
                    that.call(null, element, "validate");   // must throw Exception in case of failure
                    arguments[element.name] = value;
                }
                                
                new Ajax.Request(action, {
                    method: method,
                    arguments: arguments,
                    onSuccess: function(transport) {
                        // element.innerHTML = transport.responseText;
                        // that.propagate(element, "refreshed", evt);
                        that.call(evt, form, "submited");
                    }
                });
            }
            catch(e) {
                alert(e);
            }
            
            return false;
        }
    }
    
    return that;
}();

Ajax = function() {
    var defaultOptions = {
        method: "get",
        async: true
    }
    
    var getXhrObject = function() {
        var xhr_object = null;
        
        if(window.XMLHttpRequest) // Firefox
            xhr_object = new XMLHttpRequest();
        else if(window.ActiveXObject) // Internet Explorer
            xhr_object = new ActiveXObject("Microsoft.XMLHTTP");
        else { // XMLHttpRequest non supporté par le navigateur
            alert("Votre navigateur ne supporte pas les objets XMLHTTPRequest...");
        }
    
        return xhr_object;
    }
    
    var methodProcess = function(url, method, arguments) {
        var result = {};
        var data = "";
        
        if(arguments != null) {
            for(argument in arguments) {
                data += "&" + argument + "=" + arguments[argument];
            }
            data = data.substring(1);
        }
        
        switch(method) {
            case "get": {
                result.data = null;
                result.url = url + (data == "" ? "" : ((url.indexOf("?") == -1 ? "?" : "&") + data));
                break;
            }
            
            case "post": {
                result.url = url;
                result.data = data;
                break;
            }
        }
        
        return result;
    }
    
    var that = {
        mergeOptions: function(options) {
            for(option in defaultOptions) {
                if(null == options[option]) {
                    options[option] = defaultOptions[option];
                }
            }
            return options;
        },
        
        Request: function(url, options) {
            var now = new Date();
            url += (url.indexOf("?") < 0 ? "?" : "&") + "aleat=" + now.valueOf();
            
            options = that.mergeOptions(options);
            
            var xhr_object = getXhrObject();
            
            try {
                var methodInfos = methodProcess(url, options.method, options.arguments);
                
                xhr_object.open(options.method, methodInfos.url, options.async);
                 
                xhr_object.onreadystatechange = function() {
                    if(xhr_object.readyState == 4) {
                        switch(xhr_object.status) {
                            case 0:
                            case 200: {
                                if(options.onSuccess) {
                                    options.onSuccess(
                                        {
                                            responseXML: xhr_object.responseXML,
                                            responseText: xhr_object.responseText
                                        }
                                    );
                                }
                                break;
                            }
                        }
                    }
                };
                
                xhr_object.send(methodInfos.data);
            }
            catch(e) {
            }
        },
        
        Refresher: function(url, options) {
            new Ajax.Request(url, {
                onSuccess: function(transport) {
                    var res = null;
                    if(options.xpath) {
                        if(options.xpathResult == "single") {
                            res = XML.SelectSingleNode(transport.responseXML, options.xpath);
                            options.element.innerHTML = XML.getText(res);
                        }
                        else if(options.xpathResult == "multiple") {
                            res = XML.SelectNodes(transport.responseXML, options.xpath);
                            // options.element.innerHTML = res.length;
                        }
                    }
                    else {
                        options.element.innerHTML = transport.responseText;
                    }
                    
                    try {
                        options.onSuccess(transport, options, res);
                    }
                    catch(e) {
                        alert(options.element.id + " : " + e);
                    }
                }
            });
        },
        
        Updater: function(url, options) {
            if(options.interval == null) return;
            
            new Ajax.Refresher(url, options);
            
            setInterval(function() {
                    new Ajax.Refresher(url, options);
                },
                options.interval
            );
        }
    };
    
    return that;
}();

XML = function() {
    var that = {
        SelectNodes: function (xmldoc, xpath) {
            if (document.all) {       // IE
                var aNodeArray = xmldoc.selectNodes(xpath);
                return aNodeArray;
            }
            else                    // Gecko
            {
                var aNodeArray = new Array();
                
                var xPathResult = xmldoc.evaluate(
                    xpath,
                    xmldoc, 
                    xmldoc.createNSResolver(xmldoc.documentElement),
                    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                    null
                );
                
                if(xPathResult) {
                    var oNode = xPathResult.iterateNext();
                    while(oNode) {
                        // aNodeArray[aNodeArray.length] = oNode;
                        aNodeArray.push(oNode);
                        oNode = xPathResult.iterateNext();
                    }
                }
                
                return aNodeArray ;
            }
        },
        
        SelectSingleNode: function (xmldoc, xpath) {
            if(navigator.userAgent.indexOf('MSIE') >= 0) { // IE
                return xmldoc.selectSingleNode(xpath);
            }
            else { // Gecko
                var xPathResult = xmldoc.evaluate(
                    xpath,
                    xmldoc,
                    xmldoc.createNSResolver(xmldoc.documentElement),
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );

                if(xPathResult && xPathResult.singleNodeValue)
                    return xPathResult.singleNodeValue;
                else
                    return null;
            }
        },
        
        getText: function(node) {
            return node.firstChild.nodeValue;
        }
    }
    
    return that;
}();

function DMEvent(evt) {
    // TODO code browser dependent behaviour

    var e = evt;
    var target = null;
    
    this.getTarget = function() {
        return target;
    }
}
