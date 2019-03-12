import OpenSpaceApi from './index';
import Socket from './socket';


const password = '';

function onConnect() {
  console.log('Connected to OpenSpace');

  const property = 'Scene.Earth.Scale.Scale';
  const easingFunction = 'EaseOut';
  const duration = 1;

  openspace.authenticate(password, (data) => {
    //console.log(data);
    openspace.library().then((lib) => {
      // setInterval(() => addSceneGraphNode(lib), 2000);
      // getGeoPosition(lib);
      getTime(lib);
    });
    // scaleEarth();
  });
}

async function getTime(lib) {
  const t = await lib.time.UTC();
  console.log(t);
}

function onDisconnect() {
  console.log('Disconnected from OpenSpace');
}


function getGeoPosition(lib) {
  lib.globebrowsing.getGeoPosition("Earth", 10, 10, 10).then(data => {
    console.log(data);
  });
}

let nodeIndex = 0;
async function addSceneGraphNode(lib) {
  const identifier = 'TestNode' + nodeIndex;
  const name = 'Test Node ' + nodeIndex;
  const data = await lib.addSceneGraphNode({
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
  lib.setPropertyValue("NavigationHandler.OrbitalNavigator.Anchor", identifier);
  lib.setPropertyValue("NavigationHandler.OrbitalNavigator.RetargetAnchor", null);
  nodeIndex++;
}

function scaleEarth() {
  openspace.getProperty(property, (data) => {
    console.log(data);
    let target = 2;
    if (data.Value > 1) {
      target = 1;
    }
    openspace.setProperty(property, target, duration, easingFunction);
  });
}

const socket = new Socket('localhost', 4681);
const openspace = new OpenSpaceApi(socket, onConnect, onDisconnect);





