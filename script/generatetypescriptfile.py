import openspace
import asyncio
import os
import re
import shutil

# Get the directory of this script
script_dir = os.path.dirname(os.path.abspath(__file__))

StaticFileName = os.path.join(script_dir, "openspace-api-static.txt")
outFileName = os.path.join(script_dir, "..", "src", "types", "generated", "openspacelualibrary.ts")

def writeFunctionDocumentation(file, fun):
  """Writes the documentation of a function to file."""
  # Replace tags (\\param, \\return, \\returns) with TypeScript-style (@param, @returns)
  def replace_tag(match):
    tag = match.group(1)
    if tag == 'param':
      return '@param'
    else:  # 'return' or 'returns' -> '@returns'
      return '@returns'

  help_text = re.sub(r'\\\\(param|return|returns)', replace_tag, fun["help"])

  # Write the main description, handling multi-line
  file.write("  /**\n")
  lines = help_text.split('\n')
  for line in lines:
    if not line:
      continue
    file.write(f"   * {line}\n")
  file.write("   */\n")

def luaArgumentToTypeScript(argument):
  """
  Returns the parameter name and type of an argument converting them to TypeScript syntax.
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
      file.write(f"{luaArgumentToTypeScript(argument)}, ")

    file.write(f"{luaArgumentToTypeScript(arguments[-1])}")
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
    functionReturnType = f"Record<{firstType}, {secondType}>"

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
  # Capitalize the first letter of the library name
  capitalizedName = libraryName[0].upper() + libraryName[1:]
  interfaceName = f"{capitalizedName}Library"

  with open(outFileName, "a") as file:
    file.write(f"export interface {interfaceName} ")
    file.write("{\n")
    for fun in functions:
      writeFunctionToFile(file, fun)
    file.write("}")
    file.write(f" // interface {interfaceName}\n\n")

def writeCustomTypes(file):
  """
  Write custom helper types that are used in the API documentation but not directly
  translateable to TypeScript types.
  """
  file.write("\n")
  file.write("type path = string;\n")
  file.write("type table = object;\n")
  file.write("type action = object;\n")
  file.write("type custompropertytype = any;\n")
  file.write("type integer = number;\n")
  file.write("type vec2 = [number, number];\n")
  file.write("type vec3 = [number, number, number];\n")
  file.write("//type vec4 = [number, number, number, number];\n")
  file.write("type ivec2 = [number, number];\n")
  file.write("//type mat2x2 = { 1: number; 2: number; 3: number; 4: number; };\n")
  file.write("type mat3x3 = { 1: number; 2: number; 3: number; 4: number; 5: number;" +
              "6: number; 7: number; 8: number; 9: number; };\n"
  )
  file.write("//type mat4x4 = { 1: number; 2: number; 3: number; 4: number; 5: number;" +
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
    file.write("\n/**\n * This file was auto-generated by generatetypescriptfile.py - DO NOT MODIFY IT BY HAND\n")
    file.write(" * The following declarations are automatically generated from the " +
                "OpenSpace Lua library\n */\n")
    writeCustomTypes(file)
    file.write("export interface OpenSpaceLibrary {\n")

    for library in libraries:
      lib = library["name"]
      if not lib:
        continue
      capitalizedLib = lib[0].upper() + lib[1:]
      file.write(f"  {lib}: {capitalizedLib}Library;\n")
    file.write("\n")

    for fun in functions:
      writeFunctionToFile(file, fun)
    file.write("} // interface OpenSpaceLibrary\n\n")

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
    if not library["name"]:
      defaultLibrary = library


  # Ensure the output directory exists
  os.makedirs(os.path.dirname(outFileName), exist_ok=True)

  # Copies the "static" part of the API
  shutil.copyfile(StaticFileName, outFileName)

  if not defaultLibrary:
    print("Error: No default library found in documentation.")
    return

  # Write the dynamic parts of the API
  writeOpenSpaceInterface(docs, defaultLibrary["functions"])

  # Write the sub libraries
  for library in docs:
    if library == defaultLibrary:
      continue
    if not library["name"]:
      continue
    functions = library["functions"]
    writeLibraryToFile(library["name"], functions)

  api.disconnect()

  # There is an issue when disconnecting from the API where we get a [WinError 1236]. To
  # make it clearer that the file was successfully generated, we add a small delay which
  # allows the error message to be printed before we print the success message.
  await asyncio.sleep(0.1)

  print(f'Successfully generated types file. Saved in {outFileName}')

if __name__ == "__main__":
  asyncio.run(main())
