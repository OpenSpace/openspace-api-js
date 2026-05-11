import { OpenSpaceApi } from './api';
import { Socket } from './socket';

export default (address: string = 'localhost', port: number = 4681) =>
  new OpenSpaceApi(new Socket(address, port));
