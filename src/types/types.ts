import { AllTopics, AnyProperty, PropertyOwner } from './generated';

type TopicMap = {
  [T in AllTopics as T['topicId']]: T;
};

export type TopicId = keyof TopicMap;
export type TopicPayload<T extends TopicId> = TopicMap[T]['topicPayload'];
export type TopicData<T extends TopicId> = TopicMap[T]['data'];

export type PropertyTypeMap = {
  [T in AnyProperty as T['metaData']['type']]: T;
};
export type PropertyTypes = keyof PropertyTypeMap;
export type PropertyValue<T extends PropertyTypes> = PropertyTypeMap[T]['value'];
export type PropertyMetaData<T extends PropertyTypes> = PropertyTypeMap[T]['metaData'];

/**
 * Message struct for sending data to OpenSpace through a topic.
 */
export interface TopicMessage<T extends TopicId> {
  topic: number; // Runtime generated ID
  type?: T; // The const string of the topic e.g., 'camera'
  payload: TopicPayload<T>; // The topic payload shape for passing data to OpenSpace
}

/**
 * Message struct for receiving data from OpenSpace through a topic.
 */
export interface OpenSpaceData<T extends TopicId> {
  topic: number;
  payload: TopicData<T>;
}

export interface ISocket {
  onConnect(callback: () => void): void;
  onDisconnect(callback: () => void): void;
  onMessage(callback: (message: string) => void): void;
  connect(): void;
  disconnect(): void;
  send(message: string): void;
}

// A narrowed topic wrapper - same cancel/talk interface but with typed iterator
export interface NarrowedSubscriptionTopic<T extends PropertyTypes> {
  next(): Promise<NarrowedSubscriptionTopicData<T>>;
  [Symbol.asyncIterator](): AsyncGenerator<NarrowedSubscriptionTopicData<T>, void, void>;
  talk(data: TopicPayload<'subscribe'>): void;
  cancel(): void;
}

// Narrowed subscriptionTopicData
export type NarrowedSubscriptionTopicData<T extends keyof PropertyTypeMap> =
  | { value: PropertyValue<T>; type: 'value' }
  | { metaData: PropertyMetaData<T>; type: 'metaData' };

// Narrowed getpropertyTopicData
export type NarrowedGetPropertyTopicData<T extends PropertyTypes> =
  | { value: PropertyOwner; type: 'propertyOwner' }
  | { value: PropertyTypeMap[T]; type: 'property' };
