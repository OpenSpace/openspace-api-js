import { ISocket } from './types/types';
import net from 'net';

export class SocketWrapper implements ISocket {
  constructor(address: string, port: number) {
    this._address = address;
    this._port = port;
    this._onConnect = () => {};
    this._onDisconnect = () => {};
    this._onMessage = () => {};
    this._inBuffer = '';
  }

  onConnect(callback: () => void) {
    this._onConnect = callback;
  }

  onDisconnect(callback: () => void) {
    this._onDisconnect = callback;
  }

  onMessage(callback: (message: string) => void) {
    this._onMessage = callback;
  }

  connect() {
    this._client = net.createConnection(this._port, this._address, this._onConnect);

    // @TODO (anden 2026-03-24): should we have another delimiter instead of '\n'?
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
      this._client = null;
    });
  }

  send(message: string) {
    if (!this._client) {
      throw new Error('Cannot send: socket is not connected');
    }
    this._client.write(message + '\n');
  }

  disconnect() {
    if (!this._client) {
      return;
    }
    this._client.destroy();
    this._client = null;
  }

  private _address: string;
  private _port: number;
  private _client: net.Socket | null = null;
  private _onConnect: () => void;
  private _onDisconnect: () => void;
  private _onMessage: (message: string) => void;
  private _inBuffer: string;
}
