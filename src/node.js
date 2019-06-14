const OpenSpaceApi = require('./api');
const Socket = require('./socket');

module.exports = (address, port) => {
	return new OpenSpaceApi(
		new Socket(address || 'localhost', port || 4681)
	);
}