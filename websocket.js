export default class WebSocket {
  constructor(address, port) {
    this._address = address;
    this._port = port;    
    this._client = null;
    this._onConnect = () => {};
    this._onDisconnect = () => {};
    this._onMessage = () => {};
  }

  onConnect(cb) {
    this._onConnect = cb;
  }

  onDisconnect(cb) {
    this._onDisconnect = cb;
  }
  
  onMessage(cb) {
    this._onMessage = cb;
  }

  connect() {
    this._client = new WebSocket(this._address + ":" + this._port);
    this._client.onopen = this._onConnect;
    this._client.onclose = this._onDisconnect;
    this._client.onmessage = this._onMessage;
  }

  send(message) {
    this._client.send(message);
  }

  disconnect() {
    this._client.close();
  }
}