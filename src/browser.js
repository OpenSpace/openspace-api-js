import '@babel/polyfill';
import Api from './api';
import Ws from './websocket';

export default (address, port) => {
	return new Api(
		new Ws(address || 'localhost', port || 4682)
	);
}
