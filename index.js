import net from 'net';

class Api {
  constructor(address, port, onConnect, onDisconnect) {
    this._client = net.createConnection({ address, port }, () => {
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

  setProperty(property, value, interpolationDuration, easingFunction) {
     this.startTopic('property', {
       command: 'set',
       property,
       value,
       interpolationDuration,
       easingFunction: easingFunction || "Linear"
     });
  }

  getProperty(property, callback) {
    return this.startTopic('property', {
      command: 'get',
      property,
    }, callback);
  }

  subcribeToProperty(property, callback) {
    return this.startTopic('property', {
      command: 'subscribe',
      property
    }, callback);
  }

  unsubscribeToProperty(property, topicId) {
    this.talk(topicId, {
      command: 'unsubscribe'
    });
    delete this._callbacks[topicId];
  }

  executeLua(script) {
    this.startTopic('luascript', {
      script
    });
  }
}

export default Api;
