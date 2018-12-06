# Create application with ZetaPush
-------------------------------------------------------------------------------

Hello !

I will show you how to quickly create an application that allows you to use an Avengers character and chat with others.

ZetaPush is a back-end framework that allows you to create a serverless application using high level and remotely hosted services.

On this application, we will use 3 services :

 - [stack](https://zetapush.github.io/documentation/#_stack) &rarr; store messages in database
 - [messaging](https://zetapush.github.io/documentation/#_messaging) &rarr; send message on channel in realtime by websocket
 - [groups](https://zetapush.github.io/documentation/#_groups) &rarr; create groups to group users

We will cover these steps:

1. Installing ZetaPush and creating a new application.
2. Developing worker API (worker is used as interaction between the ZetaPush platform and your front).
3. Writing UI and worker interaction.
4. Run locally.
5. Deploy to production.

## Installing ZetaPush and creating a new application
-------------------------------------------------------------------------------

As any web project based on node.js, you need to install npm and node.
If you haven't done it already, learn how to install Node.js and npm [here](https://www.npmjs.com/get-npm).

Now, you must create an account on ZetaPush platform, for this,
[CONTACT US](https://www.zetapush.com/sign-up-for-a-free-trial).

After that, you will receive a login, a password.

To create project from command line
```console
npm init @zetapush avengers-chat
```

ZetaPush CLI asks for a developer login and a developer password : you received them after contacting us on our website.

Let's make sure everything is working properly with the generated project :

```console
cd avengers-chat
npm run start -- --serve-front
```

## Developing worker API
-------------------------------------------------------------------------------

Remember what the application should do :

- Ask to user which Avengers character he wants.
- Redirect to a chat with other users where he can view messages history and send new messages.

Technically, that's what our worker has to do :

- Create a group (if it does not already exist) that users can join, which represents the chat conversation.

```js
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
```

- Add the current user in the conversation.

```js
async addMeToConversation() {
    const output = await this.groups.addUser({
        group: CONVERSATION_ID,
        user: this.requestContext.owner
    });

    return output;
}
```

- Send a message on the chat and store it in database with stack service.

```js
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
```

- Get all messages in the conversation from stack service.

```js
async getMessages() {
    const { result } = await this.stack.list({
        stack: CONVERSATION_ID
    });

    return result;
}
```

- ... And that's all !

We put these 4 methods in a class in `worker/index.ts` :

```js
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

    /* insert the 4 methods here */

}
```

In this worker class :

- requestContext is ((insert explanation from doc))
- CONVERSATION_ID and CHANNEL_MESSAGING are constants, but we can easily turn them into variables to extend our avengers-chat.

## Writing UI and worker interaction
-------------------------------------------------------------------------------

You are free to implement your own UI so we won't explain how to code a message form or a messages container with HTML/CSS (you can steal our UI to quickly finish this tutorial).

The required parts of you front are the following :

- Include ZetaPush dependencies.

```html
<!-- ZetaPush dependencies -->
<script src="https://unpkg.com/@zetapush/client"></script>
<script src="https://unpkg.com/@zetapush/platform-legacy"></script>
```

- In `index.js`, create the ZetaPush client (credentials are injected) and a ProxyTaskService to bridge with ZetaPush platform.

```js
const client = new ZetaPushClient.WeakClient();
const api = client.createProxyTaskService();
```
Now, with `api`, you can call worker-side methods (respecting its name).

For exemple : if you have a worker-side `foo()` method, just call `api.foo()` on the front side. Same way if you have a worker-side `bar(id, name)` method that take parameters, just call `api.bar(42, 'Person')`, and parameters are transmitted.

- Create service to listen incoming messages on the channel from the worker.

```js
client.createService({
    Type: ZetaPushPlatformLegacy.Messaging,
    listener: {
        /* 'channelName': yourCallbackForEachMessageReceived */
        avengersChannel: ({ data }) => controller.onAvengersMessage(data)
        /* In your code, callback is include in a 'controller' class */
    },
});
```

The callback will receive the data send by each call to `sendMessage` on the worker side, and adds a new line in the html for each received message.

- In an asynchronous function, start a connection with ZetaPush platform and call the worker methods to : create conversation (if you're the first to join the chat), add the client to this conversation, and finally get the list of messages previously sended.

```js
async onConnectionEstablished() {
    const messages = await this.api.getMessages();

    /* Push messages into the html container */

    await this.api.createConversation();
    await this.api.addMeToConversation();
}
```

- And obviously, send message when user submit the message form

```js
this.api.sendMessage(message);
```

## Run locally
-------------------------------------------------------------------------------

Run your worker locally, and run local http server to serve your front code.

ZetaPush CLI will ask you for a developer login and a developer password : you received them after contacting us on our website.

```console
npm run start -- --serve-front
```

## Deploy to production
-------------------------------------------------------------------------------

This command will send your worker and front code to ZetaPush cloud servers.
First, stop the local worker with a (CTRL+C).

At the end of the deployment, ZetaPush CLI exposes front URL : share it with your friends !

```console
npm run deploy
```

That's it, you've deployed your first application on ZetaPush.