import { INodeProperties } from 'n8n-workflow';

// Operations for the 'chatbot' resource
export const chatbotOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['chatbot'],
      },
    },
    // eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
    options: [
      {
        name: 'Create Chatbot',
        value: 'createChatbot',
        description: 'Create a new chatbot',
        action: 'Create a chatbot',
      },
      {
        name: 'Retrain Chatbot',
        value: 'retrainChatbot',
        description: 'Retrain a chatbot with new data',
        action: 'Retrain a chatbot',
      },
      {
        name: 'Update Base Prompt',
        value: 'updateBasePrompt',
        description: 'Update a chatbot\'s base prompt',
        action: 'Update a base prompt',
      },
      {
        name: 'Get Chatbot Training Status',
        value: 'getChatbotStatus',
        description: 'Retrieve the training status of a chatbot',
        action: 'Get chatbot training status',
      },
    ],
    default: 'createChatbot',
  },
];

// Fields for the 'updateBasePrompt' operation
const updateBasePromptOperation: INodeProperties[] = [
  {
    displayName: 'Chatbot Name or ID',
    name: 'chatbot_id',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    typeOptions: {
      loadOptionsMethod: 'getChatbots',
    },
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    typeOptions: {
      loadOptionsMethod: 'getChatbots',
    },
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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

// Fields for the 'getChatbotStatus' operation
const getChatbotStatusOperation: INodeProperties[] = [
  {
    displayName: 'Chatbot Name or ID',
    name: 'chatbot_id',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    typeOptions: {
      loadOptionsMethod: 'getChatbots',
    },
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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
        resource: ['chatbot'],
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

// Combine all fields
export const chatbotFields: INodeProperties[] = [
  ...updateBasePromptOperation,
  ...retrainChatbotOperation,
  ...getChatbotStatusOperation,
  ...createChatbotOperation,
];
