import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IExecuteFunctions,
	INodeExecutionData,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { triggerOperations, triggerFields, triggerResource } from './TriggerDescription';

export class ChatDataTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chat Data Trigger',
		name: 'chatDataTrigger',
		icon: 'file:ChatData.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Triggers workflows on Chat Data events',
		defaults: {
			name: 'Chat Data Trigger',
		},
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
				isFullPath: false,
			},
		],
		credentials: [
			{
				name: 'chatDataApi',
				required: true,
			},
		],
		properties: [
			triggerResource,
			...triggerOperations,
			...triggerFields,
		],
	};

	methods = {
		loadOptions: {
			async getChatbots(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('chatDataApi');
				if (!credentials.baseUrl) {
					throw new NodeOperationError(
						this.getNode(),
						new Error('Base URL is missing in credentials. Please check your credentials configuration.'),
						{ itemIndex: 0 }
					);
				}
				const baseUrl = credentials.baseUrl as string;
				const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
				const fullUrl = `${baseUrlFormatted}/api/v2/get-chatbots`;
				try {
					const response = await this.helpers.httpRequest({
						url: fullUrl,
						method: 'GET',
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Accept': 'application/json',
							'Content-Type': 'application/json',
						},
						json: true,
						ignoreHttpStatusErrors: true,
					});
					if (response.status === 'error') {
						throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
					}
					if (!response.chatbots || !Array.isArray(response.chatbots)) {
						throw new NodeOperationError(this.getNode(), new Error('Invalid response format. Expected chatbots array.'), {
							itemIndex: 0,
						});
					}
					const options: INodePropertyOptions[] = response.chatbots.map((chatbot: { chatbotId: string; chatbotName: string }) => ({
						name: chatbot.chatbotName,
						value: chatbot.chatbotId,
					}));
					return options;
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						new Error(`Failed to fetch chatbots: ${error.message}`),
						{ itemIndex: 0 }
					);
				}
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const chatbotId = webhookData.chatbotId as string;
				const webhookUrl = webhookData.webhookUrl as string;
				if (chatbotId && webhookUrl) {
					try {
						return true;
					} catch (error) {
						return false;
					}
				}
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				try {
					const webhookUrl = this.getNodeWebhookUrl('default');
					const operation = this.getNodeParameter('operation') as string;
					let eventType = '';
					if (operation === 'onLeadSubmission') {
						eventType = 'lead-submission';
					} else if (operation === 'onLiveChatEscalation') {
						eventType = 'live-chat-escalation';
					} else if (operation === 'onNewMessage') {
						eventType = 'chat';
					} else {
						return false;
					}
					const chatbotId = this.getNodeParameter('chatbot_id') as string;
					const credentials = await this.getCredentials('chatDataApi');
					const baseUrl = credentials.baseUrl as string;
					const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
					const fullUrl = `${baseUrlFormatted}/api/v2/add-webhook`;
					const response = await this.helpers.httpRequest({
						url: fullUrl,
						method: 'POST',
						body: {
							url: webhookUrl,
							event: eventType,
							chatbotId,
						},
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Accept': 'application/json',
							'Content-Type': 'application/json',
						},
						json: true,
						ignoreHttpStatusErrors: true,
					});
					if (response.status === 'error') {
						throw new NodeOperationError(this.getNode(), response.message || 'Failed to register webhook');
					}
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.chatbotId = chatbotId;
					webhookData.eventType = eventType;
					webhookData.webhookUrl = webhookUrl;
					webhookData.isPersistent = true;

					// Store the webhook creation response for later use in execute
					webhookData.setupInfo = {
						response,
						chatbotId,
						eventType,
						webhookUrl,
						createdAt: new Date().toISOString(),
					};

					return true;
				} catch (error) {
					throw error;
				}
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				try {
					const webhookData = this.getWorkflowStaticData('node');
					const nodeSettings = this.getNode();
					const workflowMode = this.getMode();
					const isNodeRemoved = nodeSettings.disabled === true;
					const isWorkflowDeleted = workflowMode === 'internal';
					if (!isNodeRemoved && !isWorkflowDeleted) {
						return true;
					}
					const chatbotId = webhookData.chatbotId as string;
					const webhookUrl = webhookData.webhookUrl as string;
					if (chatbotId && webhookUrl) {
						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2/delete-webhook`;
						const response = await this.helpers.httpRequest({
							url: fullUrl,
							method: 'POST',
							body: {
								url: webhookUrl,
								chatbotId,
							},
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							json: true,
							ignoreHttpStatusErrors: true,
						});
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
						}
						delete webhookData.chatbotId;
						delete webhookData.eventType;
						delete webhookData.webhookUrl;
						delete webhookData.isPersistent;
						return true;
					}
					return false;
				} catch (error) {
					throw error;
				}
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		let bodyData: any;
		try {
			const rawBody = this.getRequestObject().rawBody;
			bodyData = JSON.parse(rawBody.toString());
		} catch (error) {
		}
		const operation = this.getNodeParameter('operation', 0) as string;

		// Handle different operations (event types)
		if (operation === 'onLeadSubmission' && bodyData.event !== 'lead-submission') {
			return {};
		} else if (operation === 'onLiveChatEscalation' && bodyData.event !== 'live-chat-escalation') {
			return {};
		} else if (operation === 'onNewMessage' && bodyData.event !== 'chat') {
			return {};
		}

		// Get the chatbot ID from the incoming data
		const chatbotId = bodyData.chatbot_id as string;
		const configuredChatbotId = this.getNodeParameter('chatbot_id', '') as string;

		// If a specific chatbot ID is configured and doesn't match, ignore the webhook
		if (configuredChatbotId && chatbotId !== configuredChatbotId) {
			return {};
		}

		return {
			workflowData: [this.helpers.returnJsonArray([{
				...bodyData,
				pairedItem: {
					item: 0,
					input: 0
				}
			}])]
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get operation
		const operation = this.getNodeParameter('operation', 0) as string;

		// Display webhook setup information
		const webhookData = this.getWorkflowStaticData('node');

		// Handle trigger operations based on the specific trigger type
		if (operation === 'onLeadSubmission' || operation === 'onLiveChatEscalation' || operation === 'onNewMessage') {
			// For webhook trigger, we're processing incoming webhook data
			// This runs only when the webhook is triggered
			let incomingData: any;

			if (items.length === 0 && webhookData.setupInfo) {
				// If no data is available yet, return webhook setup information
				const setupInfo = webhookData.setupInfo as any;
				incomingData = {
					webhookSetup: {
						status: 'success',
						message: 'Webhook registered successfully. Waiting for events...',
						response: setupInfo.response,
						chatbotId: setupInfo.chatbotId,
						eventType: setupInfo.eventType,
						webhookUrl: setupInfo.webhookUrl,
						createdAt: setupInfo.createdAt
					},
				};
			} else if (typeof items[0]?.json === 'object' && items[0].json !== null) {
				// If it's already an object, use directly
				incomingData = items[0].json;
			} else if (items[0]?.json) {
				// If it's a string or other type, parse it
				try {
					incomingData = JSON.parse(String(items[0].json));
				} catch (error) {
					incomingData = {
						data: items[0].json,
						parseError: 'Could not parse incoming data as JSON'
					};
				}
			} else {
				// Fallback for when no data is available
				incomingData = {
					status: 'waiting',
					message: 'Waiting for webhook data...',
					webhookInfo: webhookData.setupInfo || {
						eventType: webhookData.eventType,
						chatbotId: webhookData.chatbotId,
						webhookUrl: webhookData.webhookUrl,
					},
				};
			}

			// Process the webhook data
			const newItem = {
				json: incomingData,
			};

			returnData.push(newItem);
		} else {
			// Handle other trigger operations (polling triggers)
			for (let i = 0; i < items.length; i++) {
				try {
					const pollInterval = this.getNodeParameter('pollInterval', i) as number;

					const newItem = {
						json: {
							...items[i].json,
							success: true,
							operation,
							pollInterval,
						},
					};

					returnData.push(newItem);
				} catch (error) {
					let errorMessage = error.message;

					// Extract error message from response body
					if (error.response && error.response.body) {
						const responseBody = error.response.body;
						if (typeof responseBody === 'object' && responseBody.message) {
							errorMessage = responseBody.message;
						} else if (typeof responseBody === 'string') {
							try {
								const parsedBody = JSON.parse(responseBody);
								if (parsedBody.message) {
									errorMessage = parsedBody.message;
								}
							} catch (e) {
								// JSON parsing failed, use original error
							}
						}
					}

					if (this.continueOnFail()) {
						returnData.push({
							json: {
								...items[i].json,
								error: errorMessage,
							},
							pairedItem: i,
						});
						continue;
					}
					throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
				}
			}
		}

		return [returnData.length ? returnData : items];
	}
}
