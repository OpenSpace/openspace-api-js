# openspace-api-js

TypeScript/JavaScript library for interfacing with [OpenSpace](https://github.com/OpenSpace/OpenSpace) via TCP sockets and WebSockets.

## Installation

### npm

If you are using npm, install the latest version:

```sh
npm install openspace-api-js
```

### Script tag

If you are including the API via a script tag, the preferred approach is to load it directly from the OpenSpace CDN:

```html
<script type="text/javascript" src="https://liu-se.cdn.openspaceproject.com/api/1.0.0/openspace-api.js"></script>
```

If you require an offline-capable version, download the [latest release](https://github.com/OpenSpace/openspace-api-js/blob/master/dist/openspace-api.js) and serve it locally:

```html
<script type="text/javascript" src="openspace-api.js"></script>
```

## Migration

If you are upgrading from a previous version of this library, please see the [migration guide](https://docs.openspaceproject.com/releases-v0.22/building-content/api/api-migration.html).

## Usage

The TypeScript/JavaScript API can be used in both Node.js setups as well as browser-based setups.

### Node.js (TCP socket)

Connects to OpenSpace on port **4681** by default.

[TypeScript example](https://github.com/OpenSpace/openspace-api-js/blob/master/examples/example.ts) and [JavaScript example](https://github.com/OpenSpace/openspace-api-js/blob/master/examples/example.js) provide examples of how to connect from a Node.js application. To run the bundled Node.js example:

```sh
npm install
npm run examples-typescript # TypeScript
npm run examples-javascript # JavaScript
```

### Browser (WebSocket)

Connects to OpenSpace on port **4682** by default.

If you are loading the library as a plain `<script>` tag (e.g. `openspace-api.js` from the CDN or a downloaded bundle), the factory function is exposed on `window`:

```html
<script src="openspace-api.js"></script>
<script>
  const api = window.openspaceApi('localhost', 4682);

  api.onConnect(async () => {
    const openspace = await api.library();
    const time = await openspace.time.UTC();
    console.log('Simulation time:', time);
  });

  api.connect();
</script>
```

See [HTML example](https://github.com/OpenSpace/openspace-api-js/blob/master/examples/index.html) for a complete working example. For simplicity, it is self-contained in the index.html file.

If you are importing the library as an ES module from an npm-based project, import the entry point directly:

```ts
import openspaceApi from 'openspace-api-js';

const api = openspaceApi('localhost', 4682);
```

## Generating types from your OpenSpace build

The package ships with pre-generated types targeting a specific OpenSpace version. If your build differs, you can regenerate them locally. There are two separate generators, one for topic types and one for the Lua library. Both write directly into `src/types/generated/`.

### Generate topic types (`generate-topic-types`)

Reads JSON schema files from OpenSpace's `support/types/` directory and compiles them to TypeScript using the npm library `json-schema-to-typescript`.

**Prerequisites:**

  - Node.js
  - OpenSpace version 0.22 or later

**Steps:**

1. Run OpenSpace `DocsWriter.exe`
1. Locate the `support/types/` directory in your OpenSpace source tree
1. Run:

```sh
npm run generate-topic-types "<path-to-openspace>/support/types"
```

This writes the generated files into `src/types/generated/` and rebuilds the `AllTopics` union type used throughout the API.

### Generate Lua library types (`generate-lua-library`)

Connects to a running OpenSpace instance, fetches the full Lua API documentation via the `documentation` topic, and generates `src/types/generated/openspacelualibrary.ts`.

> **Why generate this instead of publishing it once?** The OpenSpace Lua API changes frequently, so these types are generated from a live instance rather than published to `@types` or DefinitelyTyped. Keeping generation in this repo means changes can be reflected immediately without going through an external approval process.

**Prerequisites:**

  - Python >= 3.12
  - The [OpenSpace Python API](https://github.com/OpenSpace/openspace-api-python) must be installed and importable
  - OpenSpace must be running and reachable on `localhost:4681`

**Steps:**

1. Start OpenSpace.
1. Run:

```sh
npm run generate-lua-library
```

This installs the Python dependencies (via `pip install -r script/requirements.txt`) and runs the script `script/generatetypescriptfile.py`, writing the result to `src/types/generated/openspacelualibrary.ts`.

> **Note:** The generated file is specific to the OpenSpace version that was running when the script executed. Type hints may be inaccurate if your runtime version differs from the version used to generate them.
