# OpenSpace JavaScript API - TypeScript Declaration Generator

This folder contains a helper Python script that generates a TypeScript declaration file (`d.ts`) for the OpenSpace Javascript API. This allows developers using TypeScript to have syntax highlighting, IntelliSense, and type definitions for the entire API, including OpenSpace Lua functions.

## Why this exists

Instead of publishing the `openspace-api-js.d.ts` file to the @types namespace on npm or the DefinitelyTyped repository, we keep it in this repository. Since the OpenSpace Lua API updates frequently, maintaining control over the TypeScript declaration file ensures that changes can be reflected quickly without going through a lengthy approval process.

## Usage

1.  Copy the `openspace-api-js.d.ts` file from the `declaration` folder to your project's `src` folder.
2.  Ensure your TypeScript configuration (`tsconfig.json`) includes the copied `.d.ts`file in `compilerOptions`, if necessary.

## Generating an Updated TypeScript Declaration File

The TypeScript declaration file needs to match the Lua API of the specific OpenSpace version you're using for your project. Note that the file in this repository might not be up to date with the latest OpenSpace master, or even released version.

To generate an updated `openspace-api-js.d.ts` file:

1. Start OpenSpace
2. Navigate to the script folder of the `openspace-api-js` repository:

```sh
cd openspace-api-js/script
```

3. Install dependencies using:

```sh
pip install -r requirements.txt
```

4. Run the Python Script

```sh
python generatetypescriptfile.py
```

5. The updated `openspace-api-js.d.ts` file will be saved automatically in the `declaration` folder.

## Prerequisites

- Python >= 3.8
- The OpenSpace Python API is required, see [repository](https://github.com/OpenSpace/openspace-api-python) for further details.
- Dependencies must be installed using the provided `requirements.txt` file.
- OpenSpace must be running when executing the script

## Caveats

- As of 2025-03-05 the functions `propertyValue` and `setPropertyValueSingle` do not retrieve their correct function signatures from OpenSpace due to their implementation in C++. To call these functions correctly from a TypeScript context, their type definitions must be manually adjusted:
- Change:

  ```javascript
  propertyValue: () => Promise<void>
  ```

- To

  ```javascript
  propertyValue: (uri: string) => Promise<unknown>
  ```

- Change:

  ```javascript
  setPropertyValueSingle: () => Promise<void>
  ```

- To:

  ```javascript
  setPropertyValuesingle: (uri: string, value: any, duration?: number, easingFunction?: string, script?: string) => Promise<void>
  ```

- File Updates: Keep in mind that the TypeScript declaration file in this repository may not be updated at the same rate as the OpenSpace project itself. Therefore, you might encounter discrepancies between the API definitions here and the latest version of OpenSpace.
