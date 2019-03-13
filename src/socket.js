import net from 'net';

export default class SocketWrapper {
  constructor(address, port) {
    this._address = address;
    this._port = port;    
    this._client = null;
    this._onConnect = () => {};
    this._onDisconnect = () => {};
    this._onMessage = () => {};
    this._inBuffer = '';
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
    this._client = net.createConnection(
      this._port,
      this._address,
      () => {
        this._onConnect();
      }
    );

    this._client.on('data', (data) => {
      this._inBuffer += data.toString();
      let firstNewline = this._inBuffer.indexOf('\n');
      while (firstNewline !== -1) {
        let message = this._inBuffer.substring(0, firstNewline);
        this._inBuffer = this._inBuffer.substring(firstNewline + 1);
        this._onMessage(message);
        firstNewline = this._inBuffer.indexOf('\n');
      }
    });

    this._client.on('end', () => {
      this._onDisconnect();
    });
  }

  send(message) {
    this._client.write(message + "\n");
  }

  disconnect() {
    this._client.disconnect();
  }
}