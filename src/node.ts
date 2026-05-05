import { OpenSpaceApi } from './api';
import { SocketWrapper } from './socket';

export default (address: string = 'localhost', port: number = 4681) =>
  new OpenSpaceApi(new SocketWrapper(address, port));
