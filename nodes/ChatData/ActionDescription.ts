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
      {
        name: 'Append a Message',
        value: 'appendMessage',
        description: 'Append a message to an existing conversation as a human agent or assistant',
        action: 'Append a message to an existing conversation',
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

// Fields for the 'appendMessage' operation
const appendMessageOperation: INodeProperties[] = [
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
        operation: ['appendMessage'],
      },
    },
  },
  {
    displayName: 'Conversation ID',
    name: 'conversationId',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['appendMessage'],
      },
    },
    description: 'The ID of the existing conversation to send the message to',
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    typeOptions: {
      rows: 4,
    },
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['appendMessage'],
      },
    },
    description: 'The message text to send',
  },
  {
    displayName: 'Sender Type',
    name: 'senderType',
    type: 'options',
    options: [
      {
        name: 'Human Agent',
        value: 'human',
        description: 'Send as a human customer support agent',
      },
      {
        name: 'Bot Response',
        value: 'bot',
        description: 'Send as an automated bot response',
      },
    ],
    default: 'bot',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['appendMessage'],
      },
    },
    description: 'Whether this message is from a human agent or bot',
  },
  {
    displayName: 'Agent Name',
    name: 'agentName',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['appendMessage'],
        senderType: ['human'],
      },
    },
    description: 'Name of the human agent sending the message. If not provided, the chatbot owner\'s name will be used.',
  },
  {
    displayName: 'Agent Avatar URL',
    name: 'agentAvatar',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['appendMessage'],
        senderType: ['human'],
      },
    },
    description: 'URL to the avatar image for the human agent. If not provided, the chatbot owner\'s avatar will be used.',
  },
  {
    displayName: 'File Attachments',
    name: 'files',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
      sortable: true,
    },
    default: {},
    placeholder: 'Add File',
    description: 'Attach files to the message (maximum 3 files)',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['appendMessage'],
      },
    },
    options: [
      {
        name: 'fileValues',
        displayName: 'File',
        values: [
          {
            displayName: 'File Name',
            name: 'name',
            type: 'string',
            default: '',
            description: 'Name of the file',
            required: true,
          },
          {
            displayName: 'File Type',
            name: 'type',
            type: 'options',
            options: [
              {
                name: 'PDF',
                value: 'application/pdf',
              },
              {
                name: 'Word Document (.docx)',
                value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              },
              {
                name: 'HTML',
                value: 'text/html',
              },
              {
                name: 'Plain Text',
                value: 'text/plain',
              },
              {
                name: 'PNG Image',
                value: 'image/png',
              },
              {
                name: 'JPG Image',
                value: 'image/jpg',
              },
              {
                name: 'JPEG Image',
                value: 'image/jpeg',
              },
              {
                name: 'WebP Image',
                value: 'image/webp',
              },
            ],
            default: 'application/pdf',
            description: 'MIME type of the file',
            required: true,
          },
          {
            displayName: 'File URL',
            name: 'url',
            type: 'string',
            default: '',
            description: 'Public URL where the file can be accessed',
            required: true,
          },
        ],
      },
    ],
  },
];

// Combine all fields
export const actionFields: INodeProperties[] = [
  ...sendMessageOperation,
  ...getLeadsOperation,
  ...getConversationsOperation,
  ...appendMessageOperation,
];
