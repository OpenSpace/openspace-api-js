class Api {
  constructor(socket, onConnect, onDisconnect) {
    this._callbacks = {};
    this._nextTopicId = 0;

    socket.onMessage((message) => {
      const messageObject = JSON.parse(message);
      if (messageObject.topic !== undefined) {
        this._callbacks[messageObject.topic](messageObject.payload);
      }
    });
    socket.onConnect(onConnect);
    socket.onDisconnect(onDisconnect);
    socket.connect();
    this._socket = socket;
  }

  disconnect() {
    this._socket.disconnect();
  }

  startTopic(type, payload, callback) {
    const topic = this._nextTopicId++;
    const messageObject = {
        topic: topic,
        type: type,
        payload: payload
    };
    if (callback) {
      this._callbacks[topic] = callback;
    }
    this._socket.send(JSON.stringify(messageObject));
    return topic;
  }

  talk(topic, payload) {
      const messageObject = {
          topic: topic,
          payload: payload
      };
      this._socket.send(JSON.stringify(messageObject));
  }

  // Authenticate

  authenticate(password, callback) {
    this.startTopic('authorize', {
      key: password
    }, callback);
  }

  // Properties

  setProperty(property, value, interpolationDuration, easingFunction) {
     this.startTopic('set', {
       property,
       value,
       interpolationDuration,
       easingFunction: easingFunction || "Linear"
     });
  }

  getProperty(property, callback) {
    return this.startTopic('get', {
      property,
    }, callback);
  }

  getDocumentation(type, callback) {
    return this.startTopic('documentation', {
      type
    }, callback)
  }

  subcribeToProperty(property, callback) {
    return this.startTopic('subscribe', {
      event: 'start_subscription',
      property
    }, callback);
  }

  unsubscribeToProperty(topicId) {
    this.talk(topicId, {
      event: 'stop_subscription'
    });
    delete this._callbacks[topicId];
  }

  // Lua scripts

  executeLuaScript(script, callback) {
    this.startTopic('luascript', {
      script,
      return: !!callback
    }, callback);
  }

  executeLuaFunction(fun, args, callback) {
    this.startTopic('luascript', {
      function: fun,
      arguments: args,
      return: !!callback
    }, callback);
  }

  library() {
    const generateAsyncFunction = (functionName) => {
      return (...args) => {
        return new Promise((resolve, reject) => {
          this.executeLuaFunction(functionName, args, (data) => {
            resolve(data);
          });
        })
      };
    };

    return new Promise((resolve, reject) => {
      this.getDocumentation('lua', (documentation) => {
        const jsLibrary = {};

        documentation.forEach((lib) => {
          let subJsLibrary = undefined;
          if (lib.library === '') {
            subJsLibrary = jsLibrary;
          } else {
            subJsLibrary = jsLibrary[lib.library] = {};
          }

          lib.functions.forEach((f) => {
            const fullFunctionName =
              'openspace.' +
              (subJsLibrary === jsLibrary ? '' : (lib.library + '.')) +
              f.library;

            subJsLibrary[f.library] = generateAsyncFunction(fullFunctionName);
          });
        });

        resolve(jsLibrary);
      });
    });
  }

}

export default Api;
