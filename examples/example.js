const { OpenSpaceApi } = require('../dist/api.js');
const { Socket } = require('../dist/socket.js');

const password = '';

const socket = new Socket('localhost', 4681);
const api = new OpenSpaceApi(socket);

api.onDisconnect(() => {
  console.log('Disconnected from OpenSpace');
});

api.onConnect(async () => {
  console.log('Connected to OpenSpace');

  try {
    await api.authenticate(password);
  } catch (e) {
    console.log('Authenication failed. Error: \n', e);
    return;
  }

  let openspace = {};
  try {
    openspace = await api.library();
  } catch (e) {
    console.log('OpenSpace library could not be loaded: Error: \n', e);
    return;
  }

  getTime(openspace);
  getGeoPositionForCamera(openspace);
  getScaleUpdates();
  setInterval(() => addSceneGraphNode(openspace), 2000);
  scaleEarth(api);
});

api.connect();

async function getScaleUpdates() {
  const topic = api.subscribeToProperty('Scene.Earth.Scale.Scale');
  let i = 0;

  async function loop() {
    try {
      for await (const data of topic) {
        console.log(`Earth scale: ${data}`);

        if (i > 3) {
          topic.cancel();
        }
        ++i;
      }
    } catch (e) {
      console.log('Failed to get data from property. Error: \n', e);
    }
  }

  loop();
}

async function getTime(openspace) {
  try {
    const time = await openspace.time.UTC();
    console.log(`Current simulation time: ${time} `);
  } catch (e) {
    console.log('Failed to get time. Error: \n', e);
  }
}

async function getGeoPositionForCamera(openspace) {
  try {
    const pos = await openspace.globebrowsing.geoPositionForCamera();
    console.log(`Geo position: ${pos}`);
  } catch (e) {
    console.log('Failed to get geo position for camera. Error: \n', e);
  }
}

let nodeIndex = 0;
async function addSceneGraphNode(openspace) {
  const identifier = 'TestNode' + nodeIndex;
  const name = 'Test Node ' + nodeIndex;
  try {
    await openspace.addSceneGraphNode({
      Identifier: identifier,
      Name: name,
      Parent: 'Earth',
      Transform: {
        Translation: {
          Type: 'GlobeTranslation',
          Globe: 'Earth',
          Latitude: (nodeIndex * 13) % 90,
          Longitude: (nodeIndex * 17) % 180,
          FixedAltitude: 10
        }
      },
      GUI: {
        Path: '/Other/Test',
        Name: name
      }
    });
  } catch (e) {
    console.log('Failed to add scene graph node. Error: \n ', e);
  }

  nodeIndex++;
  console.log('Added ' + name);

  try {
    openspace.setPropertyValue('NavigationHandler.OrbitalNavigator.Anchor', identifier);
    openspace.setPropertyValue('NavigationHandler.OrbitalNavigator.RetargetAnchor', null);
  } catch (e) {
    console.log('Failed to set anchor node. Error: \n ', e);
  }
}

async function scaleEarth(api) {
  const uri = 'Scene.Earth.Scale.Scale';

  const data = await api.getProperty(uri);
  if (data.type === 'property') {
    let target = 2;
    if (data.value.value > 1) {
      target = 1;
    }
    console.log(`Scaling Earth: ${target}`);
    api.setProperty(uri, target);
  } else if (data.type === 'propertyOwner') {
    console.log(`Error: expected '${uri}' to be a property `);
  }
}
