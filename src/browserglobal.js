require('core-js/stable');
require('regenerator-runtime/runtime')

const Api = require('./api');
const Ws = require('./websocket');

window.openspaceApi = (address, port) => {
	return new Api(
		new Ws(address || 'localhost', port || 4682)
	);
};
