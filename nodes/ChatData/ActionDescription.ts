import { INodeProperties } from 'n8n-workflow';

// Operations for the 'action' resource
export const actionOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['action'],
      },
    },
    // eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
    options: [
      {
        name: 'Send a Message',
        value: 'sendMessage',
        description: 'Send a message to a chat',
        action: 'Send a message to a chat',
      },
      {
        name: 'Get Leads',
        value: 'getLeads',
        description: 'Retrieve leads/customers from a chatbot',
        action: 'Get leads',
      },
      {
        name: 'Get Conversations',
        value: 'getConversations',
        description: 'Retrieve conversation history from a chatbot',
        action: 'Get conversations',
      },
    ],
    default: 'sendMessage',
  },
];

// Fields for the 'sendMessage' operation
const sendMessageOperation: INodeProperties[] = [
  {
    displayName: 'Chatbot Name or ID',
    name: 'chatbot_id',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    typeOptions: {
      loadOptionsMethod: 'getChatbots',
    },
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['sendMessage'],
      },
    },
  },
  {
    displayName: 'Messages',
    name: 'messages',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
      sortable: true,
    },
    default: {},
    placeholder: 'Add Message',
    description: 'The messages to send in the conversation',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['sendMessage'],
      },
    },
    options: [
      {
        name: 'messageValues',
        displayName: 'Message',
        values: [
          {
            displayName: 'Role',
            name: 'role',
            type: 'options',
            options: [
              {
                name: 'User',
                value: 'user',
              },
              {
                name: 'Assistant',
                value: 'assistant',
              },
            ],
            default: 'user',
            description: 'The role of the message sender',
          },
          {
            displayName: 'Content',
            name: 'content',
            type: 'string',
            default: '',
            description: 'The content of the message',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['sendMessage'],
      },
    },
    options: [
      {
        displayName: 'Conversation ID',
        name: 'conversationId',
        type: 'string',
        default: '',
        description: 'ID of the current conversation. The chatbot will generate one if undefined.',
      },
      {
        displayName: 'Base Model',
        name: 'baseModel',
        type: 'options',
        options: [
          {
            name: 'GPT 3.5',
            value: 'gpt-3.5',
          },
          {
            name: 'GPT 4o',
            value: 'gpt-4o',
          },
          {
            name: 'GPT 4',
            value: 'gpt-4',
          },
        ],
        default: 'gpt-3.5',
        description: 'The OpenAI model used in the message. Overrides the Chatbot\'s baseModel setting.',
      },
      {
        displayName: 'Base Prompt',
        name: 'basePrompt',
        type: 'string',
        default: '',
        description: 'Overrides the Chatbot\'s basePrompt when processing the Rag context',
      },
      {
        displayName: 'Append Messages',
        name: 'appendMessages',
        type: 'boolean',
        default: true,
        description: 'Whether to append messages to the previous conversation or replace them all',
      },
      {
        displayName: 'Stream Response',
        name: 'stream',
        type: 'boolean',
        default: false,
        description: 'Whether to stream back partial progress or wait for the full response',
      },
    ],
  },
];

// Fields for the 'getLeads' operation
const getLeadsOperation: INodeProperties[] = [
  {
    displayName: 'Chatbot Name or ID',
    name: 'chatbot_id',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    typeOptions: {
      loadOptionsMethod: 'getChatbots',
    },
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getLeads'],
      },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: {
      minValue: 1,
    },
    default: 50,
    description: 'Max number of results to return',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getLeads'],
      },
    },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getLeads'],
      },
    },
    options: [
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        default: '',
        description: 'Filter leads created after this date',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        default: '',
        description: 'Filter leads created before this date',
      },
      {
        displayName: 'Source',
        name: 'source',
        type: 'options',
        options: [
          {
            name: 'All Sources',
            value: '',
          },
          {
            name: 'API',
            value: 'api',
          },
          {
            name: 'Chat Data Site',
            value: 'site',
          },
          {
            name: 'Discord',
            value: 'Discord',
          },
          {
            name: 'Iframe',
            value: 'iframe',
          },
          {
            name: 'Messenger',
            value: 'Messenger',
          },
          {
            name: 'Slack',
            value: 'Slack',
          },
          {
            name: 'WhatsApp',
            value: 'Whatsapp',
          },
          {
            name: 'Widget',
            value: 'widget',
          },
        ],
        default: '',
        description: 'Filter to retrieve leads from a specific source',
      },
    ],
  },
];

// Fields for the 'getConversations' operation
const getConversationsOperation: INodeProperties[] = [
  {
    displayName: 'Chatbot Name or ID',
    name: 'chatbot_id',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    typeOptions: {
      loadOptionsMethod: 'getChatbots',
    },
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getConversations'],
      },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: {
      minValue: 1,
    },
    default: 50,
    description: 'Max number of results to return',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getConversations'],
      },
    },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getConversations'],
      },
    },
    options: [
      {
        displayName: 'Lead ID',
        name: 'leadId',
        type: 'string',
        default: '',
        description: 'The unique ID to identify the lead',
      },
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        default: '',
        description: 'Filter conversations created after this date',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        default: '',
        description: 'Filter conversations created before this date',
      },
      {
        displayName: 'Source',
        name: 'source',
        type: 'options',
        options: [
          {
            name: 'All Sources',
            value: '',
          },
          {
            name: 'API',
            value: 'api',
          },
          {
            name: 'Chat Data Site',
            value: 'site',
          },
          {
            name: 'Discord',
            value: 'Discord',
          },
          {
            name: 'Iframe',
            value: 'iframe',
          },
          {
            name: 'Messenger',
            value: 'Messenger',
          },
          {
            name: 'Slack',
            value: 'Slack',
          },
          {
            name: 'WhatsApp',
            value: 'Whatsapp',
          },
          {
            name: 'Widget',
            value: 'widget',
          },
        ],
        default: '',
        description: 'Filter to retrieve conversations from a specific source',
      },
    ],
  },
];

// Combine all fields
export const actionFields: INodeProperties[] = [
  ...sendMessageOperation,
  ...getLeadsOperation,
  ...getConversationsOperation,
];
