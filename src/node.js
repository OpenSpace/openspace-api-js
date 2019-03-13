import OpenSpaceApi from './api';
import Socket from './socket';

export default openspaceApi = (address, port) => {
	return new OpenSpaceApi(
		new Socket(address || 'localhost', port || 4681)
	);
}