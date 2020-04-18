# vscode-reason-relay

Improve quality-of-life of using ReasonRelay with VSCode.

## Features

### General

- Syntax highlighting for GraphQL in ReasonML.
- Autocomplete and validations for your GraphQL operations using the official GraphQL Language Server. Including for Relay specific directives.
- Automatically formatting all GraphQL operations in your documents using `prettier`
- Generate fragments, queries, mutations and subscriptions (and edit them in GraphiQL if `vscode-graphiql-explorer` is installed).

### Relay GraphQL Code actions

#### Automatically set up fragment for pagination

Place your cursor on a `connection` field (basically a field of any GraphQL type that ends with `Connection`). Activate code actions, and select `Set up pagination for fragment`. This will setup all needed directives on your fragment to enable pagination.

_This README is WIP and will be extended soon_.

## Setup

> In addition to this extension, you're encouraged to also install `vscode-graphiql-explorer` for the best experience.

Other than that, this extension should _Just Work(tm)_, as it finds and uses your `relay.config.js`.
