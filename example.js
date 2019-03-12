import OpenSpaceApi from './index';

const password = '';

const onConnect = () => {
  console.log('Connected to OpenSpace');

  const property = 'Scene.Earth.Scale.Scale';
  const easingFunction = 'EaseOut';
  const duration = 1;

  openspace.authenticate(password, (data) => {
    console.log(data);

    openspace.getDocumentation('lua', (documentation) => {
      const jsLibrary = {};

      documentation.forEach((lib) => {
        console.log(lib.library)

        let subJsLibrary = undefined;
        if (lib.library === '') {
          subJsLibrary = jsLibrary;
        } else {
          subJsLibrary = jsLibrary[lib.library] = {};
        }
        lib.functions.forEach((f) => {
          subJsLibrary[f.library] = () => {
             const fullFunctionName =
                'openspace.' +
                (subJsLibrary === jsLibrary ? '' : (lib.library + '.')) +
                f.library;
             openspace.executeLua(fullFunctionName + '()');
          }
        });
      });

      jsLibrary.globebrowsing.getGeoPositionForCamera();
    });

    openspace.getProperty(property, (data) => {
      console.log(data);
      let target = 2;
      if (data.Value > 1) {
        target = 1;
      }
      openspace.setProperty(property, target, duration, easingFunction);
    });
  });
}

const onDisconnect = () => {
  console.log('Disconnected from OpenSpace');
}

const openspace = new OpenSpaceApi('localhost', 4681, onConnect, onDisconnect);
