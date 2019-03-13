import '@babel/polyfill';
import OpenSpaceApi from './api';
import WebSocket from './websocket';

window.openspaceApi = (address, port) => {
	return new OpenSpaceApi(
		new WebSocket(address || 'localhost', port || 4682)
	);
};
