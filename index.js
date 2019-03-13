class Api {
  constructor(socket, onConnect, onDisconnect) {
    this._callbacks = {};
    this._nextTopicId = 0;

    socket.onMessage((message) => {
      const messageObject = JSON.parse(message);
      if (messageObject.topic !== undefined) {
        if (this._callbacks[messageObject.topic]) {
          this._callbacks[messageObject.topic](messageObject.payload);
        }
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

  startTopic(type, payload) {
    const topic = this._nextTopicId++;
    const messageObject = {
        topic: topic,
        type: type,
        payload: payload
    };
    this._socket.send(JSON.stringify(messageObject));


    let promise = null;
    const setPromise = () => {
      promise = new Promise((resolve) => {
        this._callbacks[topic] =
          (data) => { resolve({action: 'cb', data: data}); };
      });
    }

    // Todo: When stopping, the resolve should be called with some special
    // value, which should break the stream.
    const stop = () => {
      delete this._callbacks[topic];
    }

    async function* stream() {
      while (true) {
        setPromise();
        const p = await promise;
        if (p.action === 'cb') {
          yield p.data;
        }
      }
    }

    return {
      stop,
      stream: stream()
    }
  }

  talk(topic, payload) {
      const messageObject = {
          topic: topic,
          payload: payload
      };
      this._socket.send(JSON.stringify(messageObject));
  }

  // Authenticate

  async authenticate(password) {
    let topic = this.startTopic('authorize', {
      key: password
    });
    for await (const t of topic.stream) {
      topic.stop();
      return t;
    }
    // Todo: check data returned and reject if authentication failed.
  }

  // Properties

  setProperty(property, value, interpolationDuration, easingFunction) {
     const topic = this.startTopic('set', {
       property,
       value,
       interpolationDuration,
       easingFunction: easingFunction || "Linear"
     });
     topic.stop();
  }

  async getProperty(property) {
    const topic = this.startTopic('get', {
      property,
    });

    for await (const t of topic.stream) {
      topic.stop();
      return t;
    }
  }

  async getDocumentation(type) {
    const topic = this.startTopic('documentation', {
      type
    });

    for await (const t of topic.stream) {
      return t;
    }
  }

  propertyStream(property) {
    const topic = this.startTopic('subscribe', {
      event: 'start_subscription',
      property
    });

    return topic;
    // TODO: this.talk(topicId, {
    //  event: 'stop_subscription'
    // });
  }

  // Lua scripts

  async executeLuaScript(script) {
    const topic = this.startTopic('luascript', {
      script,
      return: true
    });

    for await (const data of topic.stream) {
      topic.stop();
      return data;
    }
  }

  async executeLuaFunction(fun, args) {
    const topic = this.startTopic('luascript', {
      function: fun,
      arguments: args,
      return: true
    });

    for await (const data of topic.stream) {
      topic.stop();
      return data;
    }
  }

  async library() {
    const generateAsyncFunction = (functionName) => {
      return async (...args) => {
        return await this.executeLuaFunction(functionName, args);
      }
    };

    const documentation = await this.getDocumentation('lua');
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

    return jsLibrary;
  }

}

export default Api;
