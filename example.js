import OpenSpaceApi from './index';

const onConnect = () => {
  console.log('Connected to OpenSpace');

  const property = 'Scene.Earth.Scale.Scale';
  const easingFunction = 'EaseOut';
  const duration = 1;

  openspace.getProperty(property, (data) => {
    let target = 2;
    if (data.Value > 1) {
      target = 1;
    }
    openspace.setProperty(property, target, duration, easingFunction);
  });
}

const onDisconnect = () => {
  console.log('Disconnected from OpenSpace');
}

const openspace = new OpenSpaceApi('localhost', 8000, onConnect, onDisconnect);