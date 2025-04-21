![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-chat-data

This is the official n8n integration for [Chat Data](https://chat-data.com). It provides nodes to interact with the ChatData platform, allowing you to manage chatbots, send messages, retrieve leads, and more.

## Prerequisites

To use the ChatData integration, you must have:

- A paid ChatData account. You can create an account at [chat-data.com](https://chat-data.com).
- Your ChatData API key, which you can obtain from your account settings.

## Installation

Follow these steps to install this node in your n8n instance:

```bash
npm install n8n-nodes-chat-data
```

For n8n desktop app/local installation:

```bash
n8n-node-dev --install n8n-nodes-chat-data
```

## Node Reference

### Chat Data

This node can be found in the 'Action' category in n8n.

#### Operations

The operations in this node are organized into the following categories:

##### Action

- **Send a Message**: Send a chat message to a chatbot
- **Get Leads**: Retrieve customer leads from a chatbot
- **Get Conversations**: Retrieve conversation history from a chatbot

##### Chatbot

- **Create Chatbot**: Set up a new AI-powered chatbot
- **Retrain Chatbot**: Update a chatbot with new data
- **Update Base Prompt**: Modify a chatbot's base prompt
- **Get Chatbot Training Status**: Check the status of a chatbot's training

##### Other

- **Make API Call**: Make a custom request to any Chat Data API endpoint

#### Triggers

Triggers in the ChatData node:

- **On New Message**: Triggered when a new chat message is received
- **On Lead Submission**: Triggered when a customer submits lead information
- **On Live Chat Escalation**: Triggered when a chat is escalated to a human agent

## Authentication

This node requires an API Key for authentication. To set this up:

1. Create an API key in your ChatData account:
   - Log in to your ChatData account
   - In the top right corner, click your Username > Account Settings
   - In the API Keys section, click Create a new secret key
   - Copy the API key value

2. In n8n, create a new credential:
   - Choose "ChatDataApi" as the credential type
   - Enter your API key in the API Key field
   - Enter your Chat Data instance URL (usually https://app.chat-data.com)
   - Save the credential

## Further Information

- [ChatData Website](https://chat-data.com)
- [ChatData API Documentation](https://docs.chat-data.com/api)
- [ChatData Pricing](https://chat-data.com/pricing)

## License

[MIT](LICENSE.md)
