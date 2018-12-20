# avengers-chat

A basic application that allows you to use a _Avengers_ character and chat with others.

## Tutorial

You're new with ZetaPush ? Read this [tutorial](./TUTORIAL.md) or try it on [Katacoda](https://katacoda.com/zetapush/scenarios/avengers-chat)!

## Installation

```console
npm install
```

## Deployment

Push your code on ZetaPush platform

```console
npm run deploy
```

## Development

Run your code on your local platform

```console
npm run start
```

## Project structure

```console
.
└──
  ├── front
  │  ├── index.html
  │  └── index.js
  ├── worker
  │  └── index.ts (api implementation)
  └── package.json
```

## How it works?

> Server side

Your server api in a plain old class defining your interface.

Example:

```js
export default class Api {
  hello() {
    return `Hello World from Worker ${Date.now()}`;
  }
}
```

This code expose an API called **hello** which returns a string "Hello World from Worker" concatened with server timestamp.

You can use injected platform services with to following.

> Dependency injection use [injection-js](https://github.com/mgechev/injection-js)

```js
const { Injectable } = require('@zetapush/core');
const { Stack } = require('@zetapush/platform-legacy');

export default class Api {
  constructor(private stack: Stack) {}
  push(item) {
    return this.stack.push({ stack: 'list', data: item });
  }
  list() {
    return this.stack.list({ stack: 'list' });
  }
}
```

To consume an API in your front-end application you have to create a **mapped** method.

> Client side

#### Register your API mapping class

```js
const api = client.createProxyTaskService();
```

#### Invoke your remote API method

```js
const message = await api.hello();
```
