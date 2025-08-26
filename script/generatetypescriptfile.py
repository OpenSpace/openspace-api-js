import openspace
import asyncio
import re
import shutil

StaticFileName = "openspace-api-static.txt"
outFileName = "../declaration/openspace-api-js.d.ts"

def writeFunctionDocumentation(file, fun):
  """Writes the documentation of a function to file."""
  # Obs, some documentation includes '\\param' which messes with the indentation but it
  # should be fine, the documentation for the function still works as expected.
  file.write("  /**\n   * ")
  file.write(fun["help"])
  file.write("\n   */\n")

def getArgument(argument):
  """
  Returns the parameter name and type of an argument converting them to TS syntax.
  """
  parameterName = argument["name"]
  parameterType = argument["type"]

  # If a parameter is optional it's marked with a '?' after the parameter type.
  # Typescript requires the '?' to denote an optional parameter on the name rather than
  # the type
  if "?" in parameterType:
    parameterName += "?"
    parameterType = re.sub(r'\?', '', parameterType)

  # Some function like printDebug can take any number of parameter which is specified
  # with the '*' so we translate these into a rest parameter
  if not parameterName and parameterType == "*":
    parameterName = "...args"
    parameterType = "any[]"

  # Convert 'nil' type to 'null' type
  if "nil" in parameterType.lower():
    parameterType = re.sub(r'nil', 'null', parameterType, flags=re.IGNORECASE)

  return f"{parameterName}: {parameterType.lower()}"

def writeFunctionArguments(file, fun):
  """Writes all the function parameters and types to file."""
  file.write("(")
  arguments = fun["arguments"]
  if arguments:
    for argument in arguments[:-1]:
      file.write(f"{getArgument(argument)}, ")

    file.write(f"{getArgument(arguments[-1])}")
  file.write(")")

def writeFunctionReturnType(file, fun):
  """Writes the function return type, converting it to TS syntax in special cases."""
  functionReturnType = fun["returnType"].lower()

  if not functionReturnType:
    functionReturnType = "void"

  # If the return type is a map
  if "->" in functionReturnType:
    types = functionReturnType.split("->")
    firstType = types[0].strip()
    secondType = types[1].strip()
    functionReturnType = f"Map<{firstType}, {secondType}>"

  # If we are returning a tuple of items
  if "(" in functionReturnType and ")" in functionReturnType:
    functionReturnType = re.sub('\\(', "[", functionReturnType)
    functionReturnType = re.sub('\\)', "]", functionReturnType)

  file.write(f" => Promise<{functionReturnType}>\n")

def writeFunctionToFile(file, fun):
  """
  Writes a function with corresponding documentation, arguments, and return type to file
  """
  writeFunctionDocumentation(file, fun)
  file.write(f'  {fun["name"]}: ')
  writeFunctionArguments(file, fun)
  writeFunctionReturnType(file, fun)


def writeLibraryToFile(libraryName, functions):
  """Writes a library and all of its function to file."""
  with open(outFileName, "a") as file:
    file.write(f"interface {libraryName}Library ")
    file.write("{\n")
    for fun in functions:
      writeFunctionToFile(file, fun)
    file.write("}")
    file.write(f" // interface {libraryName}Library\n\n")

def writeCustomTypes(file):
  file.write("type path = string;\n")
  file.write("type table = object;\n")
  file.write("type action = object;\n")
  file.write("type custompropertytype = any;\n")
  file.write("type integer = number;\n")
  file.write("type vec2 = [number, number];\n")
  file.write("type vec3 = [number, number, number];\n")
  file.write("type vec4 = [number, number, number, number];\n")
  file.write("type mat2x2 = { 1: number; 2: number; 3: number; 4: number; };\n")
  file.write("type mat3x3 = { 1: number; 2: number; 3: number; 4: number; 5: number;" +
              "6: number; 7: number; 8: number; 9: number; };\n"
  )
  file.write("type mat4x4 = { 1: number; 2: number; 3: number; 4: number; 5: number;" +
              "6: number; 7: number; 8: number; 9: number; 10: number; 11: number;" +
              "12: number; 13: number; 14: number; 15: number; 16: number; };\n"
  )
  file.write("type translation = object;\n")
  file.write("type spicekernel = path;\n")
  file.write('type easingfunction = "Linear" | "QuadraticEaseIn" | "QuadraticEaseOut" |' +
             '"QuadraticEaseInOut" | "CubicEaseIn" | "CubicEaseOut" | "CubicEaseInOut"|' +
             '"QuarticEaseIn" | "QuarticEaseOut" | "QuarticEaseInOut" | "QuinticEaseIn" |' +
             '"QuinticEaseOut" | "QuinticEaseInOut" | "SineEaseIn" | "SineEaseOut" | "SineEaseInOut" |' +
             '"CircularEaseIn" | "CircularEaseOut" | "CircularEaseInOut" | "ExponentialEaseIn" | ' +
             '"ExponentialEaseOut" | "ExponentialEaseInOut" | "ElasticEaseIn" | "ElasticEaseOut" |' +
             '"ElasticEaseInOut" | "BounceEaseIn" | "BounceEaseOut" | "BounceEaseInOut"\n')

  file.write("\n")

def writeOpenSpaceInterface(libraries, functions):
  """
  Writes the top level openspace interface which includes all sub libraries as well
  as functions that does not belong to any specific sub library.
  """
  with open(outFileName, "a") as file:
    file.write("\n/* The following declarations are automatically generated from " +
                "the OpenSpace lua library */\n")
    file.write("declare namespace OpenSpace {\n")
    writeCustomTypes(file)
    file.write("export interface openspace {\n")

    for library in libraries:
      lib = library["library"]
      if not lib:
        continue
      file.write(f"  {lib}: {lib}Library;\n")
    file.write("\n")

    for fun in functions:
      writeFunctionToFile(file, fun)
    file.write("} // interface openspace\n\n")

async def main():
  api = openspace.Api("localhost", 4681)

  try:
    await api.connect()
  except:
    return

  docs = await api.getDocumentation("lua")

  # Get the nameless library i.e. the functions which are directly under 'openspace'
  defaultLibrary = None
  for library in docs:
    if not library["library"]:
      defaultLibrary = library
      break

  # Copies the "static" part of the API
  shutil.copyfile(StaticFileName, outFileName)

  # Write the dynamic parts of the API
  writeOpenSpaceInterface(docs, defaultLibrary["functions"])

  for library in docs:
    if library == defaultLibrary:
      continue
    functions = library["functions"]
    writeLibraryToFile(library["library"], functions)

  with open(outFileName, 'a') as file:
    file.write("} // namespace OpenSpace")

  api.disconnect()

  print(f'Successfully generated types file. Saved in {outFileName}')

asyncio.new_event_loop().run_until_complete(main())
