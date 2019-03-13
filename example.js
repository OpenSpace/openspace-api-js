import OpenSpaceApi from './index';
import Socket from './socket';

const password = '';

async function onConnect() {
  console.log('Connected to OpenSpace');

  try {
    await api.authenticate(password);
  } catch(e) {
    console.log('Authenication failed');
    return;
  };

  let openspace = {};
  try {
    openspace = await api.library();
  } catch (e) {
    console.log('OpenSpace library could not be loaded: Error: \n', e)
    return;
  }

  getTime(openspace);
  // getGeoPositionForCamera(openspace);
  // getScaleUpdates();
  // setInterval(() => addSceneGraphNode(openspace), 2000);
  // scaleEarth(api);
}

async function getScaleUpdates() {
  const subscription = api.subscribeToProperty('Scene.Earth.Scale.Scale');
  let i = 0;
  (async () => {
    try {
      for await (const data of subscription.iterator) {
        console.log(data);
        if (i > 3) {
          subscription.cancel();
        }
        ++i;
      }
    } catch (e) {
      console.log('Failed to get data from property. Error: \n', e);
    }
  })();
}

async function getTime(openspace) {
  try {
    const t = await openspace.time.UTC();
    console.log("Current simulation time: " + t[1]);
  } catch (e) {
    console.log('failed to get time. Error: \n', e);
  }
}

function onDisconnect() {
  console.log('Disconnected from OpenSpace');
}

async function getGeoPosition(openspace) {
  try {
    const pos = await openspace.globebrowsing.getGeoPosition("Earth", 10, 10, 10);
    console.log(pos);
  } catch (e) {
    console.log('failed to get geo position. Error: \n', e);
  }
}

async function getGeoPositionForCamera(openspace) {
  try {
    const pos = await openspace.globebrowsing.getGeoPositionForCamera();
    console.log(pos);
  } catch (e) {
    console.log('failed to get geo position for camera. Error: \n', e);
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
          Type:"GlobeTranslation",
          Globe: 'Earth',
          Latitude: (nodeIndex * 13) % 90,
          Longitude: (nodeIndex * 17) % 180,
          FixedAltitude: 10
        }
      },
      GUI: {
        Path: "/Other/Test",
        Name: 'TestNode'
      }
    });
  } catch (e) {
    console.log("Failed to add scene graph node. Error: \n ", e);
  }

  nodeIndex++;
  console.log('Added ' + name);

  try {
    openspace.setPropertyValue("NavigationHandler.OrbitalNavigator.Anchor", identifier);
    openspace.setPropertyValue("NavigationHandler.OrbitalNavigator.RetargetAnchor", null);
  } catch (e) {
    console.log("Failed to set anchor node. Error: \n ", e);
  }
  
}

async function scaleEarth(api) {
  console.log('scaling earth');

  const property = 'Scene.Earth.Scale.Scale';

  const data = await api.getProperty(property);
  let target = 2;
  if (data.Value > 1) {
    target = 1;
  }
  api.setProperty(property, target);

}

const socket = new Socket('localhost', 4681);
const api = new OpenSpaceApi(socket, onConnect, onDisconnect);





