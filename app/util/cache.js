import { Cache } from 'react-native-cache';
import { AsyncStorage } from 'react-native';
import { name } from '../../package.json';

const config = {
	namespace: name,
	policy: {
		maxEntries: 50000
	},
	backend: AsyncStorage
};

const cache = new Cache(config);

export default cache;
