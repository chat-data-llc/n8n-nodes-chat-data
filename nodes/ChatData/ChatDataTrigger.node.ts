import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
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
				const eventType = webhookData.eventType as string;
				
				if (chatbotId && webhookUrl && eventType) {
					const currentWebhookUrl = this.getNodeWebhookUrl('default');
					if (webhookUrl === currentWebhookUrl) {
						return true;
					} else {
						// Clear old data since URL changed
						delete webhookData.chatbotId;
						delete webhookData.eventType;
						delete webhookData.webhookUrl;
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
		const req = this.getRequestObject();
		let bodyData: Record<string, any>;
		
		// Parse body if it's a string
		if (req.body && typeof req.body === 'string') {
			try {
				bodyData = JSON.parse(req.body);
			} catch (e) {
				bodyData = this.getBodyData();
			}
		} else {
			bodyData = this.getBodyData();
		}
		
		// Parse stringified nested fields
		if (typeof bodyData.messages === 'string') {
			try {
				bodyData.messages = JSON.parse(bodyData.messages);
			} catch (e) {
				// Keep as string if parsing fails
			}
		}
		
		if (typeof bodyData.answer === 'string') {
			try {
				bodyData.answer = JSON.parse(bodyData.answer);
			} catch (e) {
				// Keep as string if parsing fails
			}
		}
		
		if (typeof bodyData.lead === 'string') {
			try {
				bodyData.lead = JSON.parse(bodyData.lead);
			} catch (e) {
				// Keep as string if parsing fails
			}
		}
		
		return {
			workflowData: [
				this.helpers.returnJsonArray(bodyData)
			],
		};
	}

}
