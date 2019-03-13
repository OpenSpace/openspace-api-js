class Api {
  constructor(socket, onConnect, onDisconnect) {
    this._callbacks = {};
    this._nextTopicId = 0;

    socket.onMessage((message) => {
      const messageObject = JSON.parse(message);
      if (messageObject.topic !== undefined) {
        const cb = this._callbacks[messageObject.topic];
        if (cb) {
          cb(messageObject.payload);
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
        topic,
        type,
        payload
    };

    this._socket.send(JSON.stringify(messageObject));

    const promise = () => {
      return new Promise((resolve, reject) => {
        this._callbacks[topic] = resolve;
        cancelled.then(() => {
          delete this._callbacks[topic];
        });
      });
    }

    let cancel, cancelled = new Promise(resolve => cancel = resolve);

    const iterator = (async function* () {
      try {
        while (true) {
          yield await promise();
        }
      } catch (e) {
        return;
      }
    })();

    const talk = (payload) => {
      const messageObject = {
          topic,
          payload
      };
      this._socket.send(JSON.stringify(messageObject));
    }

    return {
      cancel,
      iterator,
      talk
    }
  }

  /**
   * Authentication
   */

  async authenticate(password) {
    let topic = this.startTopic('authorize', {
      key: password
    });
    try {
      const response = await topic.iterator.next();
      topic.cancel();
      return response.value;
    } catch (e) {
      throw "Authentication error: \n" + e;
    }
  }

  /**
   * Properties
   */

  setProperty(property, value) {
     const topic = this.startTopic('set', {
       property,
       value
     });
     topic.cancel();
  }

  async getProperty(property) {
    const topic = this.startTopic('get', {
      property,
    });
    try {
      const response = await topic.iterator.next();
      topic.cancel();
      return response.value;
    } catch (e) {
      throw "Error getting property. \n" + e;
    }
  }

  async getDocumentation(type) {
    const topic = this.startTopic('documentation', {
      type
    });

    try {
      const response = await topic.iterator.next();
      topic.cancel();
      return response.value;
    } catch (e) {
      throw "Error getting documentation: \n" + e;
    }
  }

  subscribeToProperty(property) {
    const topic = this.startTopic('subscribe', {
      event: 'start_subscription',
      property
    });

    return {
      iterator: topic.iterator,
      cancel: () => {
        topic.talk({
          event: 'stop_subscription'
        });
        topic.cancel();
      }
    };
  }

  /**
   * Lua
   */

  async executeLuaScript(script) {
    const topic = this.startTopic('luascript', {
      script,
      return: true
    });

    try {
      const response = await topic.iterator.next();
      topic.cancel();
      return response.value;
    } catch (e) {
      throw "Error executing lua script: \n" + e;
    }
  }

  async executeLuaFunction(fun, args) {
    const topic = this.startTopic('luascript', {
      function: fun,
      arguments: args,
      return: true
    });

    try {
      const response = await topic.iterator.next();
      topic.cancel();
      return response.value;
    } catch (e) {
      throw "Error executing lua function: \n" + e
    }
  }

  async library() {
    const generateAsyncFunction = (functionName) => {
      return async (...args) => {
        try {
          return await this.executeLuaFunction(functionName, args);
        } catch (e) {
          throw "Lua execution error: \n" + e
        }
      }
    };

    let documentation;
    try {
      documentation = await this.getDocumentation('lua');
    } catch (e) {
      throw "Failed to get documentation: \n" + e;
    }
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
