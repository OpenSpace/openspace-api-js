import net from 'net';

class Api {
  constructor(address, port, onConnect, onDisconnect) {
    this._client = net.createConnection(port, address, () => {
      onConnect();
    });

    this._onDisconnect = onDisconnect || (() => {});
    this._inBuffer = '';

    this._client.on('data', (data) => {
      this._inBuffer += data.toString();
      let firstNewline = this._inBuffer.indexOf('\n');
      while (firstNewline !== -1) {
        let jsonString = this._inBuffer.substring(0, firstNewline);
        this._inBuffer = this._inBuffer.substring(firstNewline + 1);
        const messageObject = JSON.parse(jsonString);
        if (messageObject.topic !== undefined) {
          this._callbacks[messageObject.topic](messageObject.payload);
        }
        firstNewline = this._inBuffer.indexOf('\n');
      }
    });

    this._client.on('end', () => {
      this._onDisconnect();
    });

    this._callbacks = {};
    this._nextTopicId = 0;
  }

  disconnect() {
    this._client.end();
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
    this._client.write(JSON.stringify(messageObject) + "\n");
    return topic;
  }

  talk(topic, payload) {
      const messageObject = {
          topic: topic,
          payload: payload
      };
      this._client.write(JSON.stringify(messageObject) + "\n");
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
