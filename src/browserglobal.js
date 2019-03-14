import '@babel/polyfill';
import Api from './api';
import Ws from './websocket';

window.openspaceApi = (address, port) => {
	return new Api(
		new Ws(address || 'localhost', port || 4682)
	);
};
