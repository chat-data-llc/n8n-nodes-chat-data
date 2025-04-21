import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IDataObject,
	IHttpRequestOptions,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { actionOperations, actionFields } from './ActionDescription';
import { chatbotOperations, chatbotFields } from './ChatbotDescription';
import { triggerOperations, triggerFields } from './TriggerDescription';

export class ChatData implements INodeType {
	constructor() {
		// Constructor left empty
	}

	description: INodeTypeDescription = {
		displayName: 'Chat Data',
		name: 'chatData',
		group: ['transform'],
		version: 1,
		description: 'Basic Chat Data Node',
		defaults: {
			name: 'Chat Data',
		},
		inputs: ['main'],
		outputs: ['main'],
		icon: 'file:ChatData.svg',
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		credentials: [
			{
				name: 'chatDataApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '{{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
				isFullPath: false,
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Action',
						value: 'action',
					},
					{
						name: 'Chatbot',
						value: 'chatbot',
					},
					{
						name: 'Trigger',
						value: 'trigger',
					},
				],
				default: 'action',
				description: 'Choose a resource - Trigger resource supports webhooks',
			},

			// Include operations and fields for all resources
			...actionOperations,
			...actionFields,
			...chatbotOperations,
			...chatbotFields,
			...triggerOperations,
			...triggerFields,
		],
	};

	// Method for loading options dynamically
	methods = {
		loadOptions: {
			// Get chatbots for the dropdown
			async getChatbots(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				// Get credentials
				const credentials = await this.getCredentials('chatDataApi');

				// Check if baseUrl exists
				if (!credentials.baseUrl) {
					// Provide default URL or throw error
					throw new NodeOperationError(
						this.getNode(),
						new Error('Base URL is missing in credentials. Please check your credentials configuration.'),
						{ itemIndex: 0 }
					);
				}

				const baseUrl = credentials.baseUrl as string;

				// Remove trailing slash if present to avoid double slashes
				const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

				// Make a request to the Chat Data API using full URL
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

					// Map the response to the format expected by n8n dropdown
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

	// Add a webhook method to process incoming webhooks
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();

		return {
			workflowData: [
				this.helpers.returnJsonArray(JSON.parse(JSON.stringify(bodyData)))
			],
		};
	}

	// This method is used for webhook registration/deregistration
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const chatbotId = webhookData.chatbotId as string;
				const webhookUrl = webhookData.webhookUrl as string;

				// If we have both chatbotId and webhookUrl stored, we can check if it exists
				if (chatbotId && webhookUrl) {
					try {
						// You could make an API call here to verify if the webhook still exists
						// For now, we'll just assume it does if we have the data
						return true;
					} catch (error) {
						// If there's an error, assume it doesn't exist
						return false;
					}
				}

				// No stored data, so webhook doesn't exist
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				try {
					// Get the webhook URL automatically generated by n8n
					const webhookUrl = this.getNodeWebhookUrl('default');

					// Get parameters needed for registration
					const resource = this.getNodeParameter('resource') as string;
					const operation = this.getNodeParameter('operation') as string;

					// Process webhook registration for the appropriate trigger operations
					if (resource === 'trigger') {
						// Determine event type based on operation
						let eventType = '';
						if (operation === 'onLeadSubmission') {
							eventType = 'lead-submission';
						} else if (operation === 'onLiveChatEscalation') {
							eventType = 'live-chat-escalation';
						} else if (operation === 'onNewMessage') {
							eventType = 'chat';
						} else {
							// Not a webhook-based trigger
							return false;
						}

						// Get the chatbot ID
						const chatbotId = this.getNodeParameter('chatbot_id') as string;

						// Get credentials for the API call
						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2/add-webhook`;

						// Register webhook with the appropriate event type
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

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message || 'Failed to register webhook');
						}

						// Save chatbotId, eventType and webhookUrl to use when deleting the webhook
						const webhookData = this.getWorkflowStaticData('node');
						webhookData.chatbotId = chatbotId;
						webhookData.eventType = eventType;
						webhookData.webhookUrl = webhookUrl;
						// Mark this webhook as persistent (should remain active after test runs)
						webhookData.isPersistent = true;

						return true;
					}

					return false;
				} catch (error) {
					throw error;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				try {
					const webhookData = this.getWorkflowStaticData('node');
					const nodeSettings = this.getNode();

					// Get workflow information
					const workflowMode = this.getMode();

					// Check if node is disabled (indicates removal from workflow)
					// or if the workflow is being fully deleted (not just deactivated)
					const isNodeRemoved = nodeSettings.disabled === true;
					const isWorkflowDeleted = workflowMode === 'internal';

					// Only proceed with deletion if node is removed or workflow is deleted
					if (!isNodeRemoved && !isWorkflowDeleted) {
						return true;
					}

					const chatbotId = webhookData.chatbotId as string;
					const webhookUrl = webhookData.webhookUrl as string;

					if (chatbotId && webhookUrl) {
						// Get credentials for constructing full URL
						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2/delete-webhook`;

						// Call API to remove webhook by URL and chatbotId
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

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
						}

						// Clear the stored webhook data
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

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get the resource and operation
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Process based on resource and operation
		if (resource === 'action') {
			// Handle action operations
			if (operation === 'sendMessage') {
				// Handle sendMessage operation
				for (let i = 0; i < items.length; i++) {
					try {
						const chatbotId = this.getNodeParameter('chatbot_id', i) as string;
						const messagesData = this.getNodeParameter('messages.messageValues', i, []) as IDataObject[];
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						// Validate messages data
						if (!messagesData.length) {
							throw new NodeOperationError(
								this.getNode(),
								'At least one message is required',
								{ itemIndex: i }
							);
						}

						// Format messages in the required structure
						const messages = messagesData.map((message) => ({
							role: message.role,
							content: message.content,
						}));

						// Prepare request body
						const body: IDataObject = {
							chatbotId,
							messages,
						};

						// Add additional fields if provided
						if (additionalFields.conversationId) {
							body.conversationId = additionalFields.conversationId;
						}

						if (additionalFields.baseModel) {
							body.baseModel = additionalFields.baseModel;
						}

						if (additionalFields.basePrompt) {
							body.basePrompt = additionalFields.basePrompt;
						}

						if (additionalFields.appendMessages !== undefined) {
							body.appendMessages = additionalFields.appendMessages;
						} else {
							body.appendMessages = true; // Default value
						}

						if (additionalFields.stream !== undefined) {
							body.stream = additionalFields.stream;
						} else {
							body.stream = false; // Default value
						}

						// Send the message
						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2/chat`;

						const response = await this.helpers.httpRequest({
							url: fullUrl,
							method: 'POST',
							body,
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							json: true,
							ignoreHttpStatusErrors: true,
						});

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
						}
						// Return just the plain text response as is
						const newItem = {
							json: {
								output: response,
							}
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
			} else if (operation === 'getLeads') {
				// Handle getLeads operation
				try {
					const chatbotId = this.getNodeParameter('chatbot_id', 0) as string;
					const limit = this.getNodeParameter('limit', 0) as number;
					const additionalFields = this.getNodeParameter('additionalFields', 0, {}) as IDataObject;

					// Prepare pagination items
					const returnData: INodeExecutionData[] = [];
					let responseData: IDataObject[] = [];

					// Prepare parameters for all requests
					const qs: IDataObject = {
						size: 100, // Fixed page size
					};

					// Format dates if provided
					if (additionalFields.startDate) {
						const startDate = new Date(additionalFields.startDate as string);
						qs.startTimestamp = startDate.getTime().toString();
					}

					if (additionalFields.endDate) {
						const endDate = new Date(additionalFields.endDate as string);
						qs.endTimestamp = endDate.getTime().toString();
					}

					// Add source if provided
					if (additionalFields.source) {
						qs.source = additionalFields.source;
					}

					// Initialize variables for pagination
					let hasNextPage = true;
					let pageNumber = 0;
					const credentials = await this.getCredentials('chatDataApi');
					const baseUrl = credentials.baseUrl as string;
					// Fetch data with pagination
					while (hasNextPage) {
						// Calculate start parameter for current page
						if (pageNumber > 0) {
							qs.start = (pageNumber * 100).toString();
						}

						// Make the request
						const endpoint = `/get-customers/${chatbotId}`;

						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2${endpoint}`;

						const response = await this.helpers.httpRequest({
							url: fullUrl,
							method: 'GET',
							qs,
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							json: true,
							ignoreHttpStatusErrors: true,
						});

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
						}

						// Check if we have valid data
						if (response && response.customers && Array.isArray(response.customers)) {
							// Add this page's data
							responseData = [...responseData, ...response.customers];

							// Check if there are more pages
							const totalResults = response.total as number;
							hasNextPage = totalResults > (pageNumber + 1) * 100;

							// Check if we've reached the user-specified limit
							if (limit > 0 && responseData.length >= limit) {
								responseData = responseData.slice(0, limit);
								hasNextPage = false;
								break;
							}

							// Move to next page
							pageNumber++;
						} else {
							// No valid data or error
							hasNextPage = false;
						}
					}

					// Map the data to items
					for (const item of responseData) {
						returnData.push({
							json: item,
						});
					}

					return [returnData];
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
						return [[{ json: { error: errorMessage } }]];
					}
					throw error;
				}
			} else if (operation === 'getConversations') {
				// Handle getConversations operation
				try {
					const chatbotId = this.getNodeParameter('chatbot_id', 0) as string;
					const limit = this.getNodeParameter('limit', 0) as number;
					const additionalFields = this.getNodeParameter('additionalFields', 0, {}) as IDataObject;

					// Prepare pagination items
					const returnData: INodeExecutionData[] = [];
					let responseData: IDataObject[] = [];

					// Prepare parameters for all requests
					const qs: IDataObject = {
						size: 100, // Fixed page size
					};

					// Format dates if provided
					if (additionalFields.startDate) {
						const startDate = new Date(additionalFields.startDate as string);
						qs.startTimestamp = startDate.getTime().toString();
					}

					if (additionalFields.endDate) {
						const endDate = new Date(additionalFields.endDate as string);
						qs.endTimestamp = endDate.getTime().toString();
					}

					// Add source if provided
					if (additionalFields.source) {
						qs.source = additionalFields.source;
					}

					// Add leadId if provided
					if (additionalFields.leadId) {
						qs.leadId = additionalFields.leadId;
					}

					// Initialize variables for pagination
					let hasNextPage = true;
					let pageNumber = 0;

					// Fetch data with pagination
					while (hasNextPage) {
						// Calculate start parameter for current page
						if (pageNumber > 0) {
							qs.start = (pageNumber * 100).toString();
						}

						// Make the request
						const endpoint = `/get-conversations/${chatbotId}`;

						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2${endpoint}`;
						const response = await this.helpers.httpRequest({
							url: fullUrl,
							method: 'GET',
							qs,
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							json: true,
							ignoreHttpStatusErrors: true,
						});

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
						}

						// Check if we have valid data
						if (response && response.conversations && Array.isArray(response.conversations)) {
							// Add this page's data
							responseData = [...responseData, ...response.conversations];

							// Check if there are more pages
							const totalResults = response.total as number;
							hasNextPage = totalResults > (pageNumber + 1) * 100;

							// Check if we've reached the user-specified limit
							if (limit > 0 && responseData.length >= limit) {
								responseData = responseData.slice(0, limit);
								hasNextPage = false;
								break;
							}

							// Move to next page
							pageNumber++;
						} else {
							// No valid data or error
							hasNextPage = false;
						}
					}

					// Map the data to items
					for (const item of responseData) {
						returnData.push({
							json: item,
						});
					}

					return [returnData];
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
						return [[{ json: { error: errorMessage } }]];
					}
					throw error;
				}
			}else if (operation === 'makeApiCall') {
				// Handle makeApiCall operation
				try {
					// Get main parameters
					const url = this.getNodeParameter('url', 0) as string;
					const method = this.getNodeParameter('method', 0) as string;
					const responseFormat = this.getNodeParameter('responseFormat', 0) as string;

					// Check if URL starts with '/api/v2/' and handle accordingly
					let fullUrl = url;
					if (url.startsWith('/api/v2/')) {
						// URL is a relative path, append to base URL from credentials
						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						fullUrl = `${baseUrlFormatted}${url}`;
					} else {
						// URL must start with '/api/v2/'
						throw new NodeOperationError(
							this.getNode(),
							'URL must start with "/api/v2/". Please use the format: /api/v2/your-endpoint',
							{ itemIndex: 0 }
						);
					}

					// Get credentials for authentication
					const credentials = await this.getCredentials('chatDataApi');

					// Process headers
					const headerParameters = this.getNodeParameter('headers.parameters', 0, []) as IDataObject[];
					const headers: IDataObject = {};

					// Add user-defined headers
					for (const param of headerParameters) {
						headers[param.name as string] = param.value;
					}

					// Always add authentication header with the actual API key
					headers['Authorization'] = `Bearer ${credentials.apiKey}`;

					// Process query parameters
					const queryParameters = this.getNodeParameter('qs.parameters', 0, []) as IDataObject[];
					const qs: IDataObject = {};

					for (const param of queryParameters) {
						qs[param.name as string] = param.value;
					}

					// Process body for appropriate methods
					let body;
					if (['POST', 'PUT', 'PATCH'].includes(method)) {
						const bodyParam = this.getNodeParameter('body', 0, '{}') as string;
						try {
							body = JSON.parse(bodyParam);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Body must be a valid JSON object',
								{ itemIndex: 0 }
							);
						}
					}

					// Prepare and make the request
					const requestOptions: IHttpRequestOptions = {
						url: fullUrl,
						method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
						headers: headers as Record<string, string>,
					};

					// Only add the following properties if they actually have values
					if (Object.keys(qs).length > 0) {
						requestOptions.qs = qs;
					}

					if (body !== undefined) {
						requestOptions.body = body;
						requestOptions.json = true;
					}

					// Add ignoreHttpStatusErrors option
					requestOptions.ignoreHttpStatusErrors = true;

					const response = await this.helpers.httpRequest(requestOptions);

					// Check for error
					if (response && response.status === 'error') {
						throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
					}

					// Return response in the requested format
					let responseData;
					if (responseFormat === 'string' && typeof response === 'object') {
						responseData = JSON.stringify(response);
					} else {
						responseData = response;
					}

					const returnItem = {
						json: responseData,
					};

					return [[returnItem]];
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
						return [[{
							json: {
								error: errorMessage,
								statusCode: error.statusCode || 500,
							}
						}]];
					}
					throw error;
				}
			}
		} else if (resource === 'chatbot') {
			// Handle chatbot operations
			if (operation === 'updateBasePrompt') {
				// Handle updateBasePrompt operation
				for (let i = 0; i < items.length; i++) {
					try {
						const chatbotId = this.getNodeParameter('chatbot_id', i) as string;
						const basePrompt = this.getNodeParameter('basePrompt', i) as string;

						// Prepare request body
						const body = {
							chatbotId,
							basePrompt,
						};

						// Send the update request
						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2/update-chatbot-settings`;

						const response = await this.helpers.httpRequest({
							url: fullUrl,
							method: 'POST',
							body,
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							json: true,
							ignoreHttpStatusErrors: true,
						});

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
						}

						// Return the response
						const newItem = {
							json: {
								...response,
								success: true,
								chatbotId,
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
			} else if (operation === 'retrainChatbot') {
				// Handle retrainChatbot operation
				for (let i = 0; i < items.length; i++) {
					try {
						const chatbotId = this.getNodeParameter('chatbot_id', i) as string;
						const sourceText = this.getNodeParameter('sourceText', i, '') as string;
						const qAndAsData = this.getNodeParameter('qAndAs.qAndAValues', i, []) as IDataObject[];
						const urlsData = this.getNodeParameter('urlsToScrape.urlValues', i, []) as IDataObject[];
						const scrapingOptions = this.getNodeParameter('options', i, {}) as IDataObject;

						// Format data for API
						const qAndAs = qAndAsData.length ? qAndAsData.map((qa) => ({
							question: qa.question,
							answer: qa.answer,
						})) : undefined;

						const urlsToScrape = urlsData.length ? urlsData.map((urlObj) => urlObj.url) : undefined;

						// Prepare request body
						const body: IDataObject = {
							chatbotId,
						};

						// Add optional parameters if they exist
						if (sourceText) {
							body.sourceText = sourceText;
						}

						if (qAndAs && qAndAs.length) {
							body.qAndAs = qAndAs;
						}

						if (Array.isArray(urlsToScrape) && urlsToScrape.length) {
							body.urlsToScrape = urlsToScrape;
						}

						// Add scraping options if any provided
						if (Object.keys(scrapingOptions).length) {
							body.options = scrapingOptions;
						}

						// Send the retrain request
						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2/retrain-chatbot`;

						const response = await this.helpers.httpRequest({
							url: fullUrl,
							method: 'POST',
							body,
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							json: true,
							ignoreHttpStatusErrors: true,
						});

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
						}

						// Return the response
						const newItem = {
							json: {
								...response,
								success: true,
								chatbotId,
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
			} else if (operation === 'getChatbotStatus') {
				// Handle getChatbotStatus operation
				try {
					const chatbotId = this.getNodeParameter('chatbot_id', 0) as string;

					// Make the request
					const endpoint = `/chatbot/status/${chatbotId}`;

					const credentials = await this.getCredentials('chatDataApi');
					const baseUrl = credentials.baseUrl as string;
					const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
					const fullUrl = `${baseUrlFormatted}/api/v2${endpoint}`;

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

					// Check for error
					if (response.status === 'error') {
						throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
					}

					// Return the full response as a single item
					return [[{ json: response }]];
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
						return [[{ json: { error: errorMessage } }]];
					}
					throw error;
				}
			} else if (operation === 'createChatbot') {
				try {
					const chatbotName = this.getNodeParameter('chatbotName', 0) as string;
					const model = this.getNodeParameter('model', 0) as string;
					const sourceText = this.getNodeParameter('sourceText', 0, '') as string;
					const urlsData = this.getNodeParameter('urlsToScrape.urlValues', 0, []) as IDataObject[];

					// Format URLs if provided
					const urlsToScrape = urlsData.length ? urlsData.map((urlObj) => urlObj.url) : undefined;

					// Prepare request body
					const body: IDataObject = {
						chatbotName,
						model,
					};

					// Add optional parameters if they exist
					if (sourceText) {
						body.sourceText = sourceText;
					}

					if (Array.isArray(urlsToScrape) && urlsToScrape.length) {
						body.urlsToScrape = urlsToScrape;
					}

					// Add custom backend parameters if using custom model
					if (model === 'custom-model') {
						const customBackend = this.getNodeParameter('customBackend', 0, '') as string;
						const bearer = this.getNodeParameter('bearer', 0, '') as string;

						if (customBackend) {
							body.customBackend = customBackend;
						}

						if (bearer) {
							body.bearer = bearer;
						}
					}

					// Get credentials and construct full URL
					const credentials = await this.getCredentials('chatDataApi');
					const baseUrl = credentials.baseUrl as string;

					const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
					const fullUrl = `${baseUrlFormatted}/api/v2/create-chatbot`;

					const response = await this.helpers.httpRequest({
						url: fullUrl,
						method: 'POST',
						body,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Accept': 'application/json',
							'Content-Type': 'application/json',
						},
						json: true,
						ignoreHttpStatusErrors: true,
					});

					// Check for error
					if (response.status === 'error') {
						throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
					}

					// Return the response
					return [[{ json: response }]];
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
						return [[{ json: { error: errorMessage } }]];
					}
					throw error;
				}
			}
		} else if (resource === 'trigger') {
			// Handle trigger operations based on the specific trigger type
			if (operation === 'onLeadSubmission' || operation === 'onLiveChatEscalation' || operation === 'onNewMessage') {
				// For webhook trigger, we're processing incoming webhook data
				// This runs only when the webhook is triggered
				let incomingData;
				if (typeof items[0].json === 'object' && items[0].json !== null) {
					// If it's already an object, use directly
					incomingData = items[0].json;
				} else {
					// If it's a string or other type, parse it
					incomingData = JSON.parse(String(items[0].json));
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
								resource: 'trigger',
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
		}

		return [returnData.length ? returnData : items];
	}
}
