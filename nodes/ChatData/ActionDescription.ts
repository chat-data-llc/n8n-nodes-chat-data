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
    options: [
      {
        name: 'Create Chatbot',
        value: 'createChatbot',
        description: 'Create a new chatbot',
        action: 'Create a chatbot',
      },
      {
        name: 'Get Chatbot Training Status',
        value: 'getChatbotStatus',
        description: 'Retrieve the training status of a chatbot',
        action: 'Get chatbot training status',
      },
      {
        name: 'Get Conversations',
        value: 'getConversations',
        description: 'Retrieve conversation history from a chatbot',
        action: 'Get conversations',
      },
      {
        name: 'Get Leads',
        value: 'getLeads',
        description: 'Retrieve leads/customers from a chatbot',
        action: 'Get leads',
      },
      {
        name: 'Make API Call',
        value: 'makeApiCall',
        description: 'Make a custom request to any Chat Data API endpoint',
        action: 'Make an API call',
      },
      {
        name: 'Retrain Chatbot',
        value: 'retrainChatbot',
        description: 'Retrain a chatbot with new data',
        action: 'Retrain a chatbot',
      },
      {
        name: 'Send a Message',
        value: 'sendMessage',
        description: 'Send a message to a chat',
        action: 'Send a message to a chat',
      },
      {
        name: 'Update Base Prompt',
        value: 'updateBasePrompt',
        description: 'Update a chatbot\'s base prompt',
        action: 'Update a base prompt',
      },
    ],
    default: 'createChatbot',
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

// Fields for the 'updateBasePrompt' operation
const updateBasePromptOperation: INodeProperties[] = [
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
        operation: ['updateBasePrompt'],
      },
    },
  },
  {
    displayName: 'Base Prompt',
    name: 'basePrompt',
    type: 'string',
    typeOptions: {
      rows: 5,
    },
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['updateBasePrompt'],
      },
    },
    description: 'The new base prompt for the chatbot',
  },
];

// Fields for the 'retrainChatbot' operation
const retrainChatbotOperation: INodeProperties[] = [
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
        operation: ['retrainChatbot'],
      },
    },
  },
  {
    displayName: 'Source Text',
    name: 'sourceText',
    type: 'string',
    typeOptions: {
      rows: 5,
    },
    default: '',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['retrainChatbot'],
      },
    },
    description: 'Custom text to train the chatbot with',
  },
  {
    displayName: 'Questions & Answers',
    name: 'qAndAs',
    placeholder: 'Add Q&A',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
      sortable: true,
    },
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['retrainChatbot'],
      },
    },
    options: [
      {
        name: 'qAndAValues',
        displayName: 'Q&A Pair',
        values: [
          {
            displayName: 'Question',
            name: 'question',
            type: 'string',
            default: '',
            description: 'The question on a specific topic',
            required: true,
          },
          {
            displayName: 'Answer',
            name: 'answer',
            type: 'string',
            typeOptions: {
              rows: 3,
            },
            default: '',
            description: 'The answer to the question',
            required: true,
          },
        ],
      },
    ],
  },
  {
    displayName: 'URLs to Scrape',
    name: 'urlsToScrape',
    placeholder: 'Add URL',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['retrainChatbot'],
      },
    },
    options: [
      {
        name: 'urlValues',
        displayName: 'URL',
        values: [
          {
            displayName: 'URL',
            name: 'url',
            type: 'string',
            default: '',
            description: 'The URL to scrape for training the chatbot',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Scraping Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['retrainChatbot'],
      },
    },
    options: [
      {
        displayName: 'Cookies',
        name: 'Cookies',
        type: 'string',
        default: '',
        description: 'A list of cookies separated by semicolons to authorize the scraping process',
      },
      {
        displayName: 'Extract Main Content',
        name: 'extractMainContent',
        type: 'boolean',
        default: true,
        description: 'Whether to automatically remove common non-content elements',
      },
      {
        displayName: 'Include Only Tags',
        name: 'includeOnlyTags',
        type: 'string',
        default: '',
        description: 'A comma-separated list of CSS selectors representing DOM elements to exclusively extract',
      },
      {
        displayName: 'Exclude Tags',
        name: 'excludeTags',
        type: 'string',
        default: '',
        description: 'A comma-separated list of CSS selectors representing DOM elements to exclude from the scraping result',
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

// Fields for the 'getChatbotStatus' operation
const getChatbotStatusOperation: INodeProperties[] = [
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
        operation: ['getChatbotStatus'],
      },
    },
  },
];

// Fields for the 'createChatbot' operation
const createChatbotOperation: INodeProperties[] = [
  {
    displayName: 'Chatbot Name',
    name: 'chatbotName',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['createChatbot'],
      },
    },
    description: 'Name of the chatbot to create',
  },
  {
    displayName: 'Model',
    name: 'model',
    type: 'options',
    options: [
      {
        name: 'Train With Your Own Knowledge Base',
        value: 'custom-data-upload',
      },
      {
        name: 'Veterinarity Medical Chat Model',
        value: 'medical-chat-vet',
      },
      {
        name: 'Human Medical Chat Model',
        value: 'medical-chat-human',
      },
      {
        name: 'Your Own Backend Endpoint',
        value: 'custom-model',
      },
    ],
    default: 'custom-data-upload',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['createChatbot'],
      },
    },
    description: 'The model to use for the chatbot',
  },
  {
    displayName: 'Source Text',
    name: 'sourceText',
    type: 'string',
    typeOptions: {
      rows: 5,
    },
    default: '',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['createChatbot'],
				model: ['custom-data-upload'],
      },
    },
    description: 'Text to train the chatbot with',
  },
  {
    displayName: 'Custom Backend',
    name: 'customBackend',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['createChatbot'],
        model: ['custom-model'],
      },
    },
    description: 'The custom backend endpoint. Only used when model is custom-model.',
  },
  {
    displayName: 'Bearer Token',
    name: 'bearer',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['createChatbot'],
        model: ['custom-model'],
      },
    },
    description: 'The bearer token to authorize the custom backend',
  },
  {
    displayName: 'URLs to Scrape',
    name: 'urlsToScrape',
    placeholder: 'Add URL',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['createChatbot'],
				model: ['custom-data-upload'],
      },
    },
    options: [
      {
        name: 'urlValues',
        displayName: 'URL',
        values: [
          {
            displayName: 'URL',
            name: 'url',
            type: 'string',
            default: '',
            description: 'The URL to scrape for training the chatbot',
          },
        ],
      },
    ],
  },
];

// Fields for the 'makeApiCall' operation
const makeApiCallOperation: INodeProperties[] = [
  {
    displayName: 'URL',
    name: 'url',
    type: 'string',
    default: '/api/v2/',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['makeApiCall'],
      },
    },
    description: 'Enter a path relative to the API base URL (e.g., /api/v2/create-chatbot)',
  },
  {
    displayName: 'Method',
    name: 'method',
    type: 'options',
    options: [
      {
        name: 'DELETE',
        value: 'DELETE',
      },
      {
        name: 'GET',
        value: 'GET',
      },
      {
        name: 'POST',
        value: 'POST',
      },
      {
        name: 'PUT',
        value: 'PUT',
      },
    ],
    default: 'GET',
    required: true,
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['makeApiCall'],
      },
    },
    description: 'The HTTP method to use for the request',
  },
  {
    displayName: 'Headers',
    name: 'headers',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    placeholder: 'Add Header',
    default: {
      parameters: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    },
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['makeApiCall'],
      },
    },
    options: [
      {
        name: 'parameters',
        displayName: 'Header',
        values: [
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            description: 'Name of the header',
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            description: 'Value of the header',
          },
        ],
      },
    ],
    description: 'Headers to send with the request (Authorization is automatically added)',
  },
  {
    displayName: 'Query Parameters',
    name: 'qs',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    placeholder: 'Add Parameter',
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['makeApiCall'],
      },
    },
    options: [
      {
        name: 'parameters',
        displayName: 'Parameter',
        values: [
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            description: 'Name of the parameter',
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            description: 'Value of the parameter',
          },
        ],
      },
    ],
    description: 'Query parameters to include in the request URL',
  },
  {
    displayName: 'Body',
    name: 'body',
    type: 'json',
    default: '{}',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['makeApiCall'],
        method: ['POST', 'PUT'],
      },
    },
    description: 'The body of the request (JSON format)',
  },
  {
    displayName: 'Response Format',
    name: 'responseFormat',
    type: 'options',
    options: [
      {
        name: 'JSON',
        value: 'json',
      },
      {
        name: 'String',
        value: 'string',
      },
    ],
    default: 'json',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['makeApiCall'],
      },
    },
    description: 'The format in which the response should be returned',
  }
];

// Combine all fields
export const actionFields: INodeProperties[] = [
  ...sendMessageOperation,
  ...updateBasePromptOperation,
  ...retrainChatbotOperation,
  ...getLeadsOperation,
  ...getConversationsOperation,
  ...getChatbotStatusOperation,
  ...createChatbotOperation,
  ...makeApiCallOperation,
];
