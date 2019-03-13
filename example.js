import OpenSpaceApi from './index';
import Socket from './socket';

const password = '';

async function onConnect() {
  console.log('Connected to OpenSpace');

  const property = 'Scene.Earth.Scale.Scale';
  const easingFunction = 'EaseOut';
  const duration = 1;

  try {
    await api.authenticate(password);
  } catch(e) {
    console.log('authenication failed');
    return;
  };

  console.log('auth done');

  const openspace = await api.library();
  getTime(openspace);

  getGeoPositionForCamera(openspace);

  const propertyStream = api.propertyStream('Scene.Earth.Scale.Scale');
  let i = 0;
  console.log(propertyStream);
  (async () => {
    for await (const data of propertyStream.stream) {
      //console.log(data);
      if (i > 3) {
        console.log('stop prop stream.')
        propertyStream.stop();
      }
      ++i;
    }
  })();

//setInterval(() => addSceneGraphNode(openspace), 2000);
  // scaleEarth();

}

async function getTime(openspace) {
  const t = await openspace.time.UTC();
  console.log(t);
}

function onDisconnect() {
  console.log('Disconnected from OpenSpace');
}

async function getGeoPosition(openspace) {
  const pos = await openspace.globebrowsing.getGeoPosition("Earth", 10, 10, 10);
  console.log(pos);
}

async function getGeoPositionForCamera(openspace) {
  const pos = await openspace.globebrowsing.getGeoPositionForCamera();
  console.log(pos);
}

let nodeIndex = 0;
async function addSceneGraphNode(openspace) {
  const identifier = 'TestNode' + nodeIndex;
  const name = 'Test Node ' + nodeIndex;
  const data = await openspace.addSceneGraphNode({
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

  console.log('Added ' + name);
  openspace.setPropertyValue("NavigationHandler.OrbitalNavigator.Anchor", identifier);
  openspace.setPropertyValue("NavigationHandler.OrbitalNavigator.RetargetAnchor", null);
  nodeIndex++;
}

function scaleEarth() {
  openspace.getProperty(property, (data) => {
    let target = 2;
    if (data.Value > 1) {
      target = 1;
    }
    openspace.setProperty(property, target, duration, easingFunction);
  });
}

const socket = new Socket('localhost', 4681);
const api = new OpenSpaceApi(socket, onConnect, onDisconnect);





