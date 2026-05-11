import { TopicData, TopicId, TopicPayload } from './types/types';

export class Topic<T extends TopicId> {
  /**
   * Construct a topic. (Only for internal use)
   *
   * @param iterator - An async iterator to represent data from OpenSpace
   * @param talk - The function used to send messages
   * @param cancel - The function used to cancel the topic
   */
  constructor(
    iterator: AsyncGenerator<TopicData<T>, void, void>,
    talk: (payload: TopicPayload<T>) => void,
    cancel: () => void
  ) {
    this._iterator = iterator;
    this._talk = talk;
    this._cancel = cancel;
  }

  /**
   * Send a message to OpenSpace through the topic. The shape of the message should match
   * the topic payload type. See @TODO (anden 2026-04-14): url to documentation page for
   * the available topic types and their payload shapes.
   *
   * @param data The Javascript object to send. Must be possible to encode into JSON
   */
  talk(data: TopicPayload<T>): void {
    this._talk(data);
  }

  /**
   * Allow for-await loops on the topic object. The topic will yield data from OpenSpace
   * until it is cancelled or the connection is lost.
   * Example usage:
   * `for await (const data of topic) { ... }`
   */
  [Symbol.asyncIterator]() {
    return this._iterator;
  }

  /**
   * Get the next data package from OpenSpace. This will wait until the next data package
   * is received. This function can be used in combination with `startTopic` to get data
   * from OpenSpace. Note that you can also use for-await-of loops to iterate through the
   * topic data, which might be more convenient depending on your use case.
   *
   * @returns The next awaited data package from OpenSpace
   */
  async next(): Promise<TopicData<T>> {
    const result = await this._iterator.next();

    if (result.done) {
      throw new Error('Topic iterator completed unexpectedly.');
    }

    return result.value;
  }

  /**
   * Cancel the topic subscription. After calling this function, the topic will no longer
   * yield data from OpenSpace, and any resources associated with the topic on the
   * OpenSpace server will be freed. Note that after cancelling, the topic object should
   * not be used anymore.
   */
  cancel() {
    return this._cancel();
  }

  private _iterator: AsyncGenerator<TopicData<T>, void, void>;
  private _talk: (payload: TopicPayload<T>) => void;
  private _cancel: () => void;
}
