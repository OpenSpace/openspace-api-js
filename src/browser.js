import '@babel/polyfill';
import OpenSpaceApi from './api';
import Ws from './websocket';

export default openspaceApi = (address, port) => {
	return new OpenSpaceApi(
		new Ws(address || 'localhost', port || 4682)
	);
}
