# openspace-api-js
JavaScript library to interface with [OpenSpace](https://github.com/OpenSpace/OpenSpace) using sockets and WebSockets.

## Work in progress
Both the API and libary are still very much work in progress, and are subject to change.

## Documentation
A [reference](https://openspace.github.io/openspace-api-js) can be found here. Examples are available below:

### NodeJS in the terminal
https://github.com/OpenSpace/openspace-api-js/blob/master/examples/example.ts provides an example of how to connect from a NodeTS. To run it run the following in a terminal:

```sh
npm install
npm run example
```

### Simple website
https://github.com/OpenSpace/openspace-api-js/blob/master/examples/index.html provides an example of connecting to OpenSpace from a website. For simplicity, the example is self-contained in the index.html file.

### Web application
For a proper example of how to interact with OpenSpace from a web application using npm, webpack and modern ES versions, please refer to https://github.com/OpenSpace/openspace-api-web-example.

### Observable Notebook
Use Obserable notebooks to interact with OpenSpace locally:
https://observablehq.com/@emiax/openspace-notebook-example
This may be useful for tinkering, GUI prototyping and testing the lua interface during development.

## API versioning
The Lua function types in this package are generated against a specific OpenSpace version.
If your OpenSpace version differs, the API will still work at runtime but type hints
may be inaccurate. Check the package changelog to see which OpenSpace version the
types were generated against.