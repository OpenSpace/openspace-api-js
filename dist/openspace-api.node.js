!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t){e.exports=require("net")},function(e,t,n){"use strict";function r(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}n.r(t);var o=function(){function e(t,n,r){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this._iterator=t,this._talk=n,this._cancel=r}var t,n,o;return t=e,(n=[{key:"talk",value:function(e){return this._talk(e)}},{key:"iterator",value:function(){return this._iterator}},{key:"cancel",value:function(){return this._cancel()}}])&&r(t.prototype,n),o&&r(t,o),e}();function i(e,t,n,r,o,i,a){try{var c=e[i](a),u=c.value}catch(e){return void n(e)}c.done?t(u):Promise.resolve(u).then(r,o)}function a(e){return function(){var t=this,n=arguments;return new Promise(function(r,o){var a=e.apply(t,n);function c(e){i(a,r,o,c,u,"next",e)}function u(e){i(a,r,o,c,u,"throw",e)}c(void 0)})}}function c(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function u(e){var t,n;function r(t,n){try{var i=e[t](n),a=i.value,c=a instanceof s;Promise.resolve(c?a.wrapped:a).then(function(e){c?r("next",e):o(i.done?"return":"normal",e)},function(e){r("throw",e)})}catch(e){o("throw",e)}}function o(e,o){switch(e){case"return":t.resolve({value:o,done:!0});break;case"throw":t.reject(o);break;default:t.resolve({value:o,done:!1})}(t=t.next)?r(t.key,t.arg):n=null}this._invoke=function(e,o){return new Promise(function(i,a){var c={key:e,arg:o,resolve:i,reject:a,next:null};n?n=n.next=c:(t=n=c,r(e,o))})},"function"!=typeof e.return&&(this.return=void 0)}function s(e){this.wrapped=e}"function"==typeof Symbol&&Symbol.asyncIterator&&(u.prototype[Symbol.asyncIterator]=function(){return this}),u.prototype.next=function(e){return this._invoke("next",e)},u.prototype.throw=function(e){return this._invoke("throw",e)},u.prototype.return=function(e){return this._invoke("return",e)};var f=function(){function e(t){var n=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this._callbacks={},this._nextTopicId=0,t.onConnect(function(){}),t.onDisconnect(function(){}),t.onMessage(function(e){var t=JSON.parse(e);if(void 0!==t.topic){var r=n._callbacks[t.topic];r&&r(t.payload)}}),this._socket=t}var t,n,r;return t=e,(n=[{key:"onConnect",value:function(e){this._socket.onConnect(e)}},{key:"onDisconnect",value:function(e){this._socket.onDisconnect(e)}},{key:"connect",value:function(){this._socket.connect()}},{key:"disconnect",value:function(){this._socket.disconnect()}},{key:"startTopic",value:function(e,t){var n=this,r=this._nextTopicId++,i={topic:r,type:e,payload:t};this._socket.send(JSON.stringify(i));var a,c,s=new Promise(function(e){return a=e}),f=(c=regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:e.prev=0;case 1:return e.next=4,new Promise(function(e,t){n._callbacks[r]=e,s.then(function(){delete n._callbacks[r]})});case 4:e.next=1;break;case 6:e.next=11;break;case 8:return e.prev=8,e.t0=e.catch(0),e.abrupt("return");case 11:case"end":return e.stop()}},e,null,[[0,8]])}),function(){return new u(c.apply(this,arguments))})();return new o(f,function(e){var t={topic:r,payload:e};n._socket.send(JSON.stringify(t))},a)}},{key:"authenticate",value:function(){var e=a(regeneratorRuntime.mark(function e(t){var n,r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return n=this.startTopic("authorize",{key:t}),e.prev=1,e.next=4,n.iterator().next();case 4:return r=e.sent,n.cancel(),e.abrupt("return",r.value);case 9:throw e.prev=9,e.t0=e.catch(1),"Authentication error: \n"+e.t0;case 12:case"end":return e.stop()}},e,this,[[1,9]])}));return function(t){return e.apply(this,arguments)}}()},{key:"setProperty",value:function(e,t){this.startTopic("set",{property:e,value:t}).cancel()}},{key:"getProperty",value:function(){var e=a(regeneratorRuntime.mark(function e(t){var n,r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return n=this.startTopic("get",{property:t}),e.prev=1,e.next=4,n.iterator().next();case 4:return r=e.sent,n.cancel(),e.abrupt("return",r.value);case 9:throw e.prev=9,e.t0=e.catch(1),"Error getting property. \n"+e.t0;case 12:case"end":return e.stop()}},e,this,[[1,9]])}));return function(t){return e.apply(this,arguments)}}()},{key:"getDocumentation",value:function(){var e=a(regeneratorRuntime.mark(function e(t){var n,r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return n=this.startTopic("documentation",{type:t}),e.prev=1,e.next=4,n.iterator().next();case 4:return r=e.sent,n.cancel(),e.abrupt("return",r.value);case 9:throw e.prev=9,e.t0=e.catch(1),"Error getting documentation: \n"+e.t0;case 12:case"end":return e.stop()}},e,this,[[1,9]])}));return function(t){return e.apply(this,arguments)}}()},{key:"subscribeToProperty",value:function(e){var t=this.startTopic("subscribe",{event:"start_subscription",property:e});return new o(t.iterator(),t._talk,function(){t.talk({event:"stop_subscription"}),t.cancel()})}},{key:"executeLuaScript",value:function(){var e=a(regeneratorRuntime.mark(function e(t){var n,r,o,i=arguments;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(n=!(i.length>1&&void 0!==i[1])||i[1],r=this.startTopic("luascript",{script:t,return:n}),!n){e.next=16;break}return e.prev=3,e.next=6,r.iterator().next();case 6:return o=e.sent,r.cancel(),e.abrupt("return",o.value);case 11:throw e.prev=11,e.t0=e.catch(3),"Error executing lua script: \n"+e.t0;case 14:e.next=17;break;case 16:r.cancel();case 17:case"end":return e.stop()}},e,this,[[3,11]])}));return function(t){return e.apply(this,arguments)}}()},{key:"executeLuaFunction",value:function(){var e=a(regeneratorRuntime.mark(function e(t,n){var r,o,i,a=arguments;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(r=!(a.length>2&&void 0!==a[2])||a[2],o=this.startTopic("luascript",{function:t,arguments:n,return:!0}),!r){e.next=16;break}return e.prev=3,e.next=6,o.iterator().next();case 6:return i=e.sent,o.cancel(),e.abrupt("return",i.value);case 11:throw e.prev=11,e.t0=e.catch(3),"Error executing lua function: \n"+e.t0;case 14:e.next=17;break;case 16:o.cancel();case 17:case"end":return e.stop()}},e,this,[[3,11]])}));return function(t,n){return e.apply(this,arguments)}}()},{key:"library",value:function(){var e=a(regeneratorRuntime.mark(function e(){var t,n,r,o=this;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t=function(e){return a(regeneratorRuntime.mark(function t(){var n,r,i,a=arguments;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:for(t.prev=0,n=a.length,r=new Array(n),i=0;i<n;i++)r[i]=a[i];return t.next=4,o.executeLuaFunction(e,r);case 4:return t.abrupt("return",t.sent);case 7:throw t.prev=7,t.t0=t.catch(0),"Lua execution error: \n"+t.t0;case 10:case"end":return t.stop()}},t,null,[[0,7]])}))},e.prev=1,e.next=4,this.getDocumentation("lua");case 4:n=e.sent,e.next=10;break;case 7:throw e.prev=7,e.t0=e.catch(1),"Failed to get documentation: \n"+e.t0;case 10:return r={},n.forEach(function(e){var n=void 0;n=""===e.library?r:r[e.library]={},e.functions.forEach(function(o){var i="openspace."+(n===r?"":e.library+".")+o.library;n[o.library]=t(i)})}),e.abrupt("return",r);case 13:case"end":return e.stop()}},e,this,[[1,7]])}));return function(){return e.apply(this,arguments)}}()}])&&c(t.prototype,n),r&&c(t,r),e}(),l=n(0),p=n.n(l);function v(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}var h=function(){function e(t,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this._address=t,this._port=n,this._client=null,this._onConnect=function(){},this._onDisconnect=function(){},this._onMessage=function(){},this._inBuffer=""}var t,n,r;return t=e,(n=[{key:"onConnect",value:function(e){this._onConnect=e}},{key:"onDisconnect",value:function(e){this._onDisconnect=e}},{key:"onMessage",value:function(e){this._onMessage=e}},{key:"connect",value:function(){var e=this;this._client=p.a.createConnection(this._port,this._address,function(){e._onConnect()}),this._client.on("data",function(t){e._inBuffer+=t.toString();for(var n=e._inBuffer.indexOf("\n");-1!==n;){var r=e._inBuffer.substring(0,n);e._inBuffer=e._inBuffer.substring(n+1),e._onMessage(r),n=e._inBuffer.indexOf("\n")}}),this._client.on("end",function(){e._onDisconnect()})}},{key:"send",value:function(e){this._client.write(e+"\n")}},{key:"disconnect",value:function(){this._client.disconnect()}}])&&v(t.prototype,n),r&&v(t,r),e}();t.default=openspaceApi=function(e,t){return new f(new h(e||"localhost",t||4681))}}]);