import net from 'net';

class Api {
  constructor(address, port, onConnect, onDisconnect) {
    this._client = net.createConnection(port, address, () => {
      onConnect();
    });

    this._onDisconnect = onDisconnect || (() => {});

    this._client.on('data', (data) => {
      const messageObject = JSON.parse(data.toString());
      if (messageObject.topic !== undefined) {
        this._callbacks[messageObject.topic](messageObject.payload);
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

  executeLua(script) {
    this.startTopic('luascript', {
      script
    });
  }
}

export default Api;
