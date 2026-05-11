import { OpenSpaceApi } from './api';
import { WebSocketWrapper } from './websocket';

export default (address: string = 'localhost', port: number = 4682) =>
  new OpenSpaceApi(new WebSocketWrapper(address, port));
