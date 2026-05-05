import { ISocket } from './types/types';

export class WebSocketWrapper implements ISocket {
  constructor(address: string, port: number) {
    this._address = address;
    this._port = port;
    this._onConnect = () => {};
    this._onDisconnect = () => {};
    this._onMessage = () => {};
  }

  onConnect(callback: () => void) {
    this._onConnect = callback;
  }

  onDisconnect(callback: () => void) {
    this._onDisconnect = callback;
  }

  onMessage(callback: (message: string) => void) {
    this._onMessage = (event) => {
      callback(event.data);
    };
  }

  connect() {
    this._client = new WebSocket(`ws://${this._address}:${this._port}`);
    this._client.onopen = this._onConnect;
    this._client.onclose = () => {
      this._onDisconnect();
      this._client = null;
    };
    this._client.onmessage = this._onMessage;
  }

  send(message: string) {
    if (!this._client) {
      throw new Error('Cannot send: socket is not connected');
    }
    this._client.send(message);
  }

  disconnect() {
    if (!this._client) {
      return;
    }
    this._client.close();
    this._client = null;
  }

  private _address: string;
  private _port: number;
  private _client: WebSocket | null = null;
  private _onConnect: () => void;
  private _onDisconnect: () => void;
  private _onMessage: (event: MessageEvent) => void;
}
