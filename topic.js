class Topic {

  /**
   * Construct a topic. (Only for internal use)
   * @param {generator} iterator - An async iterator to represent data from OpenSpace.
   * @param {function} talk - The funciton used to send messages.
   * @param {function} cancel - The funciton used to cancel the topic.
   */
  constructor(iterator, talk, cancel) {
    this._iterator = iterator;
    this._talk = talk;
    this._cancel = cancel;
  }


  /**
   * Send data within a topic
   * @param {object} data - The JavaScript object to send.
   *        Must be possible to encode into JSON.
   */
  talk(data) {
    return this._talk(data);
  }

  /**
   * Get the async iterator used to get data from OpenSpace.
   */
  iterator() {
    return this._iterator;
  }

  /**
   * Cancel the topic.
   */
  cancel() {
    return this._cancel();
  }
}

export default Topic;