import { OpenSpaceApi } from '../src/api';
import { Socket } from '../src/socket';
import { OpenSpaceLibrary } from '../src/types/generated';

const password = '';

const socket = new Socket('localhost', 4681);
const api = new OpenSpaceApi(socket);

let openspace: OpenSpaceLibrary | null = null;

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

  try {
    openspace = await api.library();
  } catch (e) {
    console.log('OpenSpace library could not be loaded: Error: \n', e);
    return;
  }

  await main();
});

api.connect();

async function main() {
  await getTime();
  await scaleEarth();
  await getGeoPositionForCamera();
  await getScaleUpdates();

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      addSceneGraphNode();
    }, 2000);
  }

  setTimeout(() => {
    api.disconnect();
  }, 10000);
}

async function getTime() {
  try {
    const time = await openspace?.time.UTC();
    console.log('Current simulation time: ' + time);
  } catch (e) {
    console.log('Failed to get time. Error: \n', e);
  }
}

async function getGeoPositionForCamera() {
  try {
    if (!openspace) {
      return;
    }

    const pos = await openspace.globebrowsing.geoPositionForCamera();
    console.log('Geo position', pos);
  } catch (e) {
    console.log('Failed to get geo position for camera. Error: \n', e);
  }
}

async function getScaleUpdates() {
  const topic = api.subscribeToProperty('Scene.Earth.Scale.Scale');
  let i = 0;

  async function loop() {
    try {
      for await (const data of topic) {
        console.log(`Waiting for Earth scale update ${i}/3`);
        if (data.type === 'value') {
          console.log(`Earth scale value update ${i}/3: ${data.value}`);
        } else {
          console.log(`Earth metadata update ${i}/3: ${data.metaData}`);
        }

        if (i >= 3) {
          console.log('Canceling topic');
          topic.cancel();
          return;
        }
        ++i;
      }
    } catch (e) {
      console.log('Failed to get data from property. Error: \n', e);
    }
  }

  await loop();
}

let nodeIndex = 0;
async function addSceneGraphNode() {
  const identifier = 'TestNode' + nodeIndex;
  const name = 'Test Node ' + nodeIndex;
  try {
    await openspace?.addSceneGraphNode({
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

  openspace?.setPropertyValue('NavigationHandler.OrbitalNavigator.Anchor', identifier);
  openspace?.setPropertyValue('NavigationHandler.OrbitalNavigator.RetargetAnchor', null);
}

async function scaleEarth() {
  // There are two options for getting a property where the only difference is the type
  // IntelliSense
  const uri = 'Scene.Earth.Scale.Scale';

  {
    // Option 1: Get the property value
    const data = await api.getProperty(uri);
    if (data.type === 'property') {
      const property = data.value; // The type of property is unknown at this point

      // However, in this case we know that Earth.Scale is a DoubleProperty so we can tell
      // TypeScript IntelliSense to treat it like a number to avoid TypeScript error
      const value = property.value as number;

      let target = 2;
      if (value > 1) {
        target = 1;
      }
      console.log('Scaling Earth: ' + target);
      api.setProperty(uri, target);
    }
  }
  //   else if (data.type === 'propertyOwner') {
  //     console.log('Error: expected ' + uri + ' to be a property');
  //   }

  // Option 2: Get the property with as an expected property type
  {
    const data = await api.getProperty(uri, 'DoubleProperty');
    if (data.type === 'property') {
      // If we got this far, property is now correctly narrowed to a DoubleProperty
      const property = data.value;

      // No need to do `as number` - value I already correctly inferred
      const value = property.value;
      let target = 2;
      if (value > 1) {
        target = 1;
      }
      console.log('Scaling Earth: ' + target);
      api.setProperty(uri, target);
    }
  }
}
