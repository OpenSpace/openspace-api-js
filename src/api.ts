import { Topic } from './topic';
import { JsonValue } from './types/generated';
import {
  AssetData,
  Factory,
  KeyboardData,
  LicenseEntry,
  LuaLibrary
} from './types/generated/documentationtopic';
import { OpenSpaceLibrary } from './types/generated/openspacelualibrary';
import {
  ISocket,
  NarrowedGetPropertyTopicData,
  NarrowedSubscriptionTopicData,
  NarrowedSubscriptionTopic,
  OpenSpaceData,
  PropertyMetaData,
  PropertyTypes,
  PropertyValue,
  TopicData,
  TopicId,
  TopicMessage,
  TopicPayload
} from './types/types';

type TopicID = number;

const ApiVersion = {
  type: 'apiHandshake',
  apiVersion: {
    major: 1,
    minor: 0,
    patch: 0
  }
} as const;

export class OpenSpaceApi {
  private _callbacks: Record<TopicID, (payload: unknown) => void> = {};
  private _nextTopicId: TopicID = 0;
  private _socket: ISocket;
  private _userOnConnect: (() => void) | null = null;

  /**
   * Construct an instance of the OpenSpace API.
   *
   * @param socket - An instance of Socket or WebSocket. The socket should not be
   * connected prior to calling this constructor.
   */
  constructor(socket: ISocket) {
    socket.onMessage((message) => {
      try {
        const messageObject = JSON.parse(message) as OpenSpaceData<TopicId>;
        if (messageObject.topic !== undefined) {
          const callback = this._callbacks[messageObject.topic];
          if (callback && 'payload' in messageObject) {
            callback(messageObject.payload);
          }
        }
      } catch (e) {
        console.error(`Error handling message from OpenSpace: ${e}\nMessage: ${message}`);
      }
    });

    this._socket = socket;
    this._socket.onConnect(() => {
      // Always send API handshake before any user-registered onConnect
      this._sendHandshake();
      // Call user defined onConnect if it exists
      this._userOnConnect?.();
    });
  }

  private _sendHandshake() {
    this._socket.send(JSON.stringify(ApiVersion));
  }

  /**
   * Set connect callback.
   *
   * @param callback - The function to execute when connection is established.
   */
  onConnect(callback: () => void) {
    this._userOnConnect = callback;
  }

  /**
   * Set disconnect callback.
   *
   * @param callback - The function to execute when socket is disconnected.
   */
  onDisconnect(callback: () => void) {
    this._socket.onDisconnect(callback);
  }

  /**
   * Connect to OpenSpace.
   */
  connect() {
    this._socket.connect();
  }

  /**
   * Disconnect from OpenSpace.
   */
  disconnect() {
    this._socket.disconnect();
  }

  /**
   * Initialize a new channel of communication
   *
   * @param type - A string specifying the type of topic to construct. See OpenSpace's
   * server module for available topic types.
   * @param payload - An object containing the data to send to OpenSpace when initializing
   * the topic.
   * @param cancelPayload - An optional object containing the data to send to OpenSpace
   * as a last message before cancelling and closing the topic.
   * @return An object representing the topic.
   */
  startTopic<T extends TopicId>(
    type: T,
    payload: TopicPayload<T>,
    cancelPayload?: TopicPayload<T>
  ): Topic<T> {
    const topicID = this._nextTopicId++;
    const messageObject: TopicMessage<T> = {
      topic: topicID,
      type,
      payload
    };

    this._socket.send(JSON.stringify(messageObject));

    // `cancelPromise` resolves when the topic is cancelled, which causes the iterator to
    // stop yielding and the callback to be cleaned up. @TODO (anden88: 2025-05-05): does
    // the topic cancel correctly if we're still waiting for data that hasn't received yet?
    let resolveCancel = () => {};
    const cancelPromise = new Promise<void>((resolve) => (resolveCancel = resolve));

    const promise = (): Promise<TopicData<T>> => {
      return new Promise<TopicData<T>>((resolve) => {
        // The callback stores all active topics each with a different payload data type
        // so we can't get away from casting the payload as unknown here.
        this._callbacks[topicID] = resolve as (payload: unknown) => void;
        cancelPromise.then(() => {
          delete this._callbacks[topicID];
        });
      });
    };

    const iterator = (async function* () {
      try {
        while (true) {
          yield await promise();
        }
      } catch (e) {
        return;
      }
    })();

    const talk = (payload: TopicPayload<T>) => {
      const messageObject: TopicMessage<T> = {
        topic: topicID,
        payload
      };
      this._socket.send(JSON.stringify(messageObject));
    };

    const cancel = () => {
      if (cancelPayload !== undefined) {
        talk(cancelPayload);
      }
      resolveCancel();
    };

    return new Topic<T>(iterator, talk, cancel);
  }

  /**
   * Authenticate this client. This must be done if the client is not whitelisted in
   * openspace.cfg.
   *
   * @param secret - The secret used to authenticate with OpenSpace.
   */
  async authenticate(secret: string): Promise<TopicData<'authorize'>> {
    const topic = this.startTopic('authorize', {
      password: secret
    });
    try {
      return await topic.next();
    } catch (e) {
      throw new Error(`Authentication error: ${e}\n`);
    } finally {
      topic.cancel();
    }
  }

  /**
   * Set the property value.
   *
   * @param property - The URI of the property to set.
   * @param value - The value to set the property to.
   */
  setProperty(property: string, value: JsonValue) {
    const topic = this.startTopic('set', {
      property,
      value
    });
    topic.cancel();
  }

  /**
   * Get a property or property owner.
   *
   * @param property - The URI of the property to get.
   * @return The value of the property or property owner.
   */
  async getProperty(property: string): Promise<TopicData<'get'>>;
  async getProperty<T extends PropertyTypes>(
    property: string,
    expectedType: T
  ): Promise<NarrowedGetPropertyTopicData<T>>;
  async getProperty<T extends PropertyTypes>(
    property: string,
    expectedType?: T
  ): Promise<TopicData<'get'> | NarrowedGetPropertyTopicData<T>> {
    const topic = this.startTopic('get', { property });
    try {
      const data = await topic.next();
      if (expectedType === undefined) {
        return data;
      }

      if (data.type === 'property') {
        const propertyType = data.value.metaData.type;
        if (propertyType !== expectedType) {
          throw new Error(
            `Expected: '${expectedType}' but property '${property}' is of type '${propertyType}'`
          );
        }
      }
      return data as NarrowedGetPropertyTopicData<T>;
    } catch (e) {
      throw new Error(`Error getting property. ${e}\n`);
    } finally {
      topic.cancel();
    }
  }

  /**
   * Get documentation from OpenSpace.
   *
   * @param type - The type of documentation to get.
   * @return An object representing the requested documentation.
   */
  async getDocumentation(type: 'lua'): Promise<LuaLibrary[]>;
  async getDocumentation(type: 'factories'): Promise<Factory[]>;
  async getDocumentation(type: 'keyboard'): Promise<KeyboardData>;
  async getDocumentation(type: 'asset'): Promise<AssetData>;
  async getDocumentation(type: 'meta'): Promise<LicenseEntry[]>;
  async getDocumentation(
    type: TopicPayload<'documentation'>['type']
  ): Promise<TopicData<'documentation'>>;

  async getDocumentation(
    type: TopicPayload<'documentation'>['type']
  ): Promise<TopicData<'documentation'>> {
    const topic = this.startTopic('documentation', {
      type
    });
    try {
      return await topic.next();
    } catch (e) {
      throw new Error(`Error getting documentation: ${e}\n`);
    } finally {
      topic.cancel();
    }
  }

  /**
   * Subscribe to a property value. Anytime the property value changes, the subscribed
   * topic receives the updated value.
   *
   * @param property - The URI of the property.
   * @param expectedType - The expected property type to subscribe to. If the expected
   * type is different from the actual type an error is thrown.
   * @return A topic object to represent the subscription topic. When cancelled, this
   * object will unsubscribe to the property.
   */
  subscribeToProperty(property: string): Topic<'subscribe'>;
  subscribeToProperty<T extends PropertyTypes>(
    property: string,
    expectedType: T
  ): NarrowedSubscriptionTopic<T>;

  subscribeToProperty<T extends PropertyTypes>(
    property: string,
    expectedType?: T
  ): Topic<'subscribe'> | NarrowedSubscriptionTopic<T> {
    const topic = this.startTopic(
      'subscribe',
      { event: 'start_subscription', uri: property },
      { event: 'stop_subscription' }
    );

    if (expectedType === undefined) {
      return topic;
    }

    const expected = expectedType;

    async function* narrowedIterator(): AsyncGenerator<
      NarrowedSubscriptionTopicData<T>,
      void,
      void
    > {
      // MetaData object is the first value to be returned by OpenSpace
      for await (const data of topic) {
        if (data.type === 'metaData') {
          if (data.metaData.type !== expected) {
            topic.cancel();
            throw new Error(
              `Expected: '${expected}' but property '${property}' is of type: '${data.metaData.type}'`
            );
          }
          yield data as { metaData: PropertyMetaData<T>; type: 'metaData' };
        } else if (data.type === 'value') {
          yield data as { value: PropertyValue<T>; type: 'value' };
        } else {
          throw new Error(`Missing case for data package: '${data}'`);
        }
      }
    }

    return {
      next: async () => {
        const result = await narrowedIterator().next();
        if (result.done) {
          throw new Error('Topic iterator completed unexpectedly.');
        }
        return result.value;
      },
      [Symbol.asyncIterator]: narrowedIterator,
      talk: (data) => topic.talk(data),
      cancel: () => topic.cancel()
    };
  }

  // @TODO (anden88: 2026-05-06): Right now any lua function will create a new topic.
  // should we instead let the class keep one reference to the luascript topic and this
  // function uses the topic.talk to pass the new scripts, returning data as necessary
  // only arguably benefit would be that we don't create a bunch of topics that gets
  // immediately destroyed

  /**
   * Execute a Lua script.
   *
   * @param script - The Lua script to execute.
   * @param getReturnValue - Specified whether the return value should be collected.
   * @param shouldBeSynchronized - Specified whether the script should be synchronized on
   * a cluster.
   * @return The return value of the script, if `getReturnValue` is true, otherwise
   * undefined.
   */
  async executeLuaScript(
    script: string,
    getReturnValue = true,
    shouldBeSynchronized = true
  ): Promise<TopicData<'luascript'> | void> {
    const topic = this.startTopic('luascript', {
      script,
      return: getReturnValue,
      shouldBeSynchronized
    });

    if (!getReturnValue) {
      topic.cancel();
      return;
    }

    try {
      const response = await topic.next();
      return response;
    } catch (e) {
      throw new Error(`Error executing lua script: ${e}\n`);
    } finally {
      topic.cancel();
    }
  }

  // Overloads for executeLuaFunction to get better typings on the return value when
  // `getReturnValue` is true

  /**
   * Execute a Lua function from the OpenSpace library.
   *
   * @param fun - The Lua function to execute, for example `openspace.addSceneGraphNode`.
   * @param args - The function arguments.
   * @param getReturnValue - Specified whether the return value should be collected
   * @return The return value of the script, if `getReturnValue` is true, otherwise
   * nothing.
   */
  async executeLuaFunction(
    fun: string,
    args: unknown[],
    getReturnValue: true
  ): Promise<TopicData<'luascript'>>;

  async executeLuaFunction(
    fun: string,
    args: unknown[],
    getReturnValue: false
  ): Promise<void>;

  // Allow calling the `executeLuaFunction` without specifying `getReturnValue`, in which
  // case it defaults to true. I.e., `executeLuaFunction(functionName, args);`
  async executeLuaFunction(fun: string, args: unknown[]): Promise<TopicData<'luascript'>>;

  async executeLuaFunction(
    fun: string,
    args: unknown[],
    getReturnValue = true
  ): Promise<TopicData<'luascript'> | void> {
    const topic = this.startTopic('luascript', {
      function: fun,
      arguments: args,
      return: getReturnValue
    });

    if (!getReturnValue) {
      topic.cancel();
      return;
    }

    try {
      const response = await topic.next();
      return response;
    } catch (e) {
      throw new Error(`Error executing lua function: ${e}\n`);
    } finally {
      topic.cancel();
    }
  }

  /**
   * Get an object representing the OpenSpace Lua library.
   *
   * @return The Lua library, mapped to async JavaScript functions.
   */
  async library<T = OpenSpaceLibrary>(): Promise<T> {
    // These are generic helper types used to build the OpenSpace library. Since we don't
    // know until runtime what functions and namespaces the library contains we need more
    // general and forgiving types
    type JsLuaFunction = (...args: unknown[]) => Promise<unknown>;
    type JsSubLibrary = Record<string, JsLuaFunction>;
    type JsLibrary = {
      [key: string]: JsLuaFunction | JsSubLibrary;
    };

    const generateAsyncFunction = (functionName: string): JsLuaFunction => {
      return async (...args: unknown[]): Promise<unknown> => {
        try {
          const luaTable = await this.executeLuaFunction(functionName, args);
          if (luaTable) {
            return (luaTable as Record<number, unknown>)[1];
          }
          return null;
        } catch (e) {
          throw new Error(`Lua execution error: ${e}\n`);
        }
      };
    };

    let documentation: LuaLibrary[];
    try {
      documentation = await this.getDocumentation('lua');
    } catch (e) {
      throw new Error(`Failed to get documentation: ${e}\n`);
    }
    const jsLibrary: JsLibrary = {};

    documentation.forEach((library) => {
      if (library.name === '') {
        // Direct openspace.* function add to top level
        library.functions.forEach((f) => {
          const fullFunctionName = `openspace.${f.name}`;
          jsLibrary[f.name] = generateAsyncFunction(fullFunctionName);
        });
      } else {
        // Namespaced function, create sub-library
        const subLibrary: JsSubLibrary = {};
        library.functions.forEach((f) => {
          const fullFunctionName = `openspace.${library.name}.${f.name}`;
          subLibrary[f.name] = generateAsyncFunction(fullFunctionName);
        });
        jsLibrary[library.name] = subLibrary;
      }
    });

    return jsLibrary as T;
  }
}
