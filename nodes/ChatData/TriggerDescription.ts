import { INodeProperties } from 'n8n-workflow';

// Define the resource property for the trigger
export const triggerResource: INodeProperties = {
  displayName: 'Resource',
  name: 'resource',
  type: 'hidden',
  default: 'trigger',
};

// Operations for the 'trigger' resource
export const triggerOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['trigger'],
      },
    },
    options: [
      {
        name: 'On Lead Submission',
        value: 'onLeadSubmission',
        description: 'Trigger when a lead submission occurs',
        action: 'Triggers when a lead submission occurs',
      },
      {
        name: 'On Live Chat Escalation',
        value: 'onLiveChatEscalation',
        description: 'Trigger when a chat is escalated to a live agent',
        action: 'Triggers when a chat is escalated to a live agent',
      },
      {
        name: 'On New Message',
        value: 'onNewMessage',
        description: 'Trigger when a new chat message is received',
        action: 'Triggers when a new chat message is received',
      },
    ],
    default: 'onNewMessage',
  },
];

// Fields for the 'onLeadSubmission' operation
export const onLeadSubmissionOperation: INodeProperties[] = [
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
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onLeadSubmission'],
      },
    },
  },
  {
    displayName: 'Webhook',
    name: 'webhook',
    type: 'hidden',
    default: 'default',
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onLeadSubmission'],
      },
    },
  },
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Options',
    default: {},
    options: [
      {
        displayName: 'Enable Webhook Debug',
        name: 'webhookDebug',
        type: 'boolean',
        default: false,
        description: 'Whether to turn on additional logging for webhook debugging',
      },
    ],
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onLeadSubmission'],
      },
    },
  },
];

// Fields for the 'onLiveChatEscalation' operation
export const onLiveChatEscalationOperation: INodeProperties[] = [
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
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onLiveChatEscalation'],
      },
    },
  },
  {
    displayName: 'Webhook',
    name: 'webhook',
    type: 'hidden',
    default: 'default',
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onLiveChatEscalation'],
      },
    },
  },
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Options',
    default: {},
    options: [
      {
        displayName: 'Enable Webhook Debug',
        name: 'webhookDebug',
        type: 'boolean',
        default: false,
        description: 'Whether to turn on additional logging for webhook debugging',
      },
    ],
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onLiveChatEscalation'],
      },
    },
  },
];

// Fields for the 'onNewMessage' operation
export const onNewMessageOperation: INodeProperties[] = [
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
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onNewMessage'],
      },
    },
  },
  {
    displayName: 'Webhook',
    name: 'webhook',
    type: 'hidden',
    default: 'default',
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onNewMessage'],
      },
    },
  },
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Options',
    default: {},
    options: [
      {
        displayName: 'Enable Webhook Debug',
        name: 'webhookDebug',
        type: 'boolean',
        default: false,
        description: 'Whether to turn on additional logging for webhook debugging',
      },
    ],
    displayOptions: {
      show: {
        resource: ['trigger'],
        operation: ['onNewMessage'],
      },
    },
  },
];

// Combine all fields
export const triggerFields: INodeProperties[] = [
  ...onLeadSubmissionOperation,
  ...onLiveChatEscalationOperation,
  ...onNewMessageOperation,
];
