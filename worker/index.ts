import { Injectable, Context } from '@zetapush/core';
import { Stack, Messaging, Groups } from '@zetapush/platform-legacy';

const CONVERSATION_ID = 'avengersChat';
const CHANNEL_MESSAGING = 'avengersChannel';

@Injectable()
export default class AvengersApi {
  private requestContext!: Context;
  constructor(
    private stack: Stack,
    private messaging: Messaging,
    private groups: Groups
  ) {}
  /**
   * Create the conversation of the chat, if doesn't already exists
   */
  async createConversation() {
    const { exists } = await this.groups.exists({
      group: CONVERSATION_ID
    });
    if (!exists) {
      await this.groups.createGroup({
        group: CONVERSATION_ID
      });
    }
  }
  /**
   * Add the current user in the conversation
   */
  async addMeToConversation() {
    const output = await this.groups.addUser({
      group: CONVERSATION_ID,
      user: this.requestContext.owner
    });
    return output;
  }
  /**
   * Send a message on the chat
   * @param {Object} message
   */
  async sendMessage(message = {}) {
    // Get all users inside the conversation
    const group = await this.groups.groupUsers({
      group: CONVERSATION_ID
    });
    const users = group.users || [];

    // Send the message to each user in the conversation
    this.messaging.send({
      target: users,
      channel: CHANNEL_MESSAGING,
      data: { message }
    });

    // Store the message in a stack
    await this.stack.push({
      stack: CONVERSATION_ID,
      data: message
    });

    return group;
  }
  /**
   * Get all messages in the conversation
   */
  async getMessages() {
    const { result } = await this.stack.list({
      stack: CONVERSATION_ID
    });
    return result;
  }
}
