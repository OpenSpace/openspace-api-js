import { OpenSpaceApi } from './api';
import { WebSocketWrapper } from './websocket';

declare global {
  interface Window {
    openspaceApi: (address?: string, port?: number) => OpenSpaceApi;
  }
}

window.openspaceApi = (address: string = 'localhost', port: number = 4682) =>
  new OpenSpaceApi(new WebSocketWrapper(address, port));
