import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
	NodeConnectionTypes,
} from 'n8n-workflow';

import {
	actionFields,
	actionOperations,
} from './ActionDescription';

import {
	chatbotFields,
	chatbotOperations,
} from './ChatbotDescription';

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
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionTypes.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionTypes.Main],
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
				],
				default: 'action',
				description: 'Choose a resource',
			},

			// Include operations and fields for all resources
			...actionOperations,
			...actionFields,
			...chatbotOperations,
			...chatbotFields,
		],
	};

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

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'chatDataApi',
							{
								url: fullUrl,
								method: 'POST',
								body,
								headers: {
									'Accept': 'application/json',
									'Content-Type': 'application/json',
								},
								json: true,
								ignoreHttpStatusErrors: true,
							}
						);

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
						}
						// Return just the plain text response as is
						const newItem = {
							json: {
								output: response,
							},
							pairedItem: {
								item: i,
								input: 0
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
								pairedItem: {
									item: i,
									input: 0
								}
							});
							continue;
						}
						throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
					}
				}
			} else if (operation === 'getLeads') {
				// Handle getLeads operation
				for (let i = 0; i < items.length; i++) {
					try {
						const chatbotId = this.getNodeParameter('chatbot_id', i) as string;
						const limit = this.getNodeParameter('limit', i) as number;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						// Prepare pagination items
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

							const response = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'chatDataApi',
								{
									url: fullUrl,
									method: 'GET',
									qs,
									headers: {
										'Accept': 'application/json',
										'Content-Type': 'application/json',
									},
									json: true,
									ignoreHttpStatusErrors: true,
								}
							);

							// Check for error
							if (response.status === 'error') {
								throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
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
								pairedItem: {
									item: i,
									input: 0
								}
							});
						}
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
								pairedItem: {
									item: i,
									input: 0
								}
							});
							continue;
						}
						throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
					}
				}
			} else if (operation === 'getConversations') {
				// Handle getConversations operation
				for (let i = 0; i < items.length; i++) {
					try {
						const chatbotId = this.getNodeParameter('chatbot_id', i) as string;
						const limit = this.getNodeParameter('limit', i) as number;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						// Prepare pagination items
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
							const response = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'chatDataApi',
								{
									url: fullUrl,
									method: 'GET',
									qs,
									headers: {
										'Accept': 'application/json',
										'Content-Type': 'application/json',
									},
									json: true,
									ignoreHttpStatusErrors: true,
								}
							);

							// Check for error
							if (response.status === 'error') {
								throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
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
								pairedItem: {
									item: i,
									input: 0
								}
							});
						}
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
								pairedItem: {
									item: i,
									input: 0
								}
							});
							continue;
						}
						throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
					}
				}
			} else if (operation === 'appendMessage') {
				// Handle appendMessage operation
				for (let i = 0; i < items.length; i++) {
					try {
						// Extract required parameters
						const chatbotId = this.getNodeParameter('chatbot_id', i) as string;
						const conversationId = this.getNodeParameter('conversationId', i) as string;
						const message = this.getNodeParameter('message', i) as string;
						const senderType = this.getNodeParameter('senderType', i) as string;

						// Validate required fields
						if (!chatbotId) {
							throw new NodeOperationError(
								this.getNode(),
								'Chatbot ID is required',
								{ itemIndex: i }
							);
						}

						if (!conversationId) {
							throw new NodeOperationError(
								this.getNode(),
								'Conversation ID is required',
								{ itemIndex: i }
							);
						}

						const trimmedMessage = message.trim();
						if (!trimmedMessage) {
							throw new NodeOperationError(
								this.getNode(),
								'Message text is required and cannot be empty',
								{ itemIndex: i }
							);
						}

						// Map simplified role to API role
						const apiRole = senderType === 'human' ? 'human' : 'assistant';

						// Build request body with required fields
						const body: IDataObject = {
							chatbotId,
							conversationId,
							message: trimmedMessage,
							role: apiRole,
						};

						// Add conditional human agent fields
						if (senderType === 'human') {
							const agentName = this.getNodeParameter('agentName', i, '') as string;
							const agentAvatar = this.getNodeParameter('agentAvatar', i, '') as string;

							if (agentName) {
								body.name = agentName;
							}

							if (agentAvatar) {
								body.avatar = agentAvatar;
							}
						}

						// Handle file attachments if provided
						const filesData = this.getNodeParameter('files.fileValues', i, []) as IDataObject[];

						if (filesData.length > 0) {
							// Validate max 3 files
							if (filesData.length > 3) {
								throw new NodeOperationError(
									this.getNode(),
									'Maximum of 3 file attachments allowed',
									{ itemIndex: i }
								);
							}

							// Validate each file entry has required fields
							for (const file of filesData) {
								if (!file.name || !file.type || !file.url) {
									throw new NodeOperationError(
										this.getNode(),
										'Each file attachment must have name, type, and url',
										{ itemIndex: i }
									);
								}
							}

							// Format files for API
							const files = filesData.map((file) => ({
								name: file.name,
								type: file.type,
								url: file.url,
							}));

							body.files = files;
						}

						// Get credentials and construct URL
						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2/live-chat`;

						// Make the API request
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'chatDataApi',
							{
								url: fullUrl,
								method: 'POST',
								body,
								headers: {
									'Accept': 'application/json',
									'Content-Type': 'application/json',
								},
								json: true,
								ignoreHttpStatusErrors: true,
							}
						);

						// Check for API error response
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
						}

						// Return response with proper pairedItem structure (wrapped in output)
						returnData.push({
							json: {
								output: response,
							},
							pairedItem: {
								item: i,
								input: 0
							}
						});
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

						// Handle continueOnFail mode
						if (this.continueOnFail()) {
							returnData.push({
								json: {
									...items[i].json,
									error: errorMessage,
								},
								pairedItem: {
									item: i,
									input: 0
								}
							});
							continue;
						}
						throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
					}
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

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'chatDataApi',
							{
								url: fullUrl,
								method: 'POST',
								body,
								headers: {
									'Accept': 'application/json',
									'Content-Type': 'application/json',
								},
								json: true,
								ignoreHttpStatusErrors: true,
							}
						);

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
							pairedItem: {
								item: i,
								input: 0
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
								pairedItem: {
									item: i,
									input: 0
								}
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

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'chatDataApi',
							{
								url: fullUrl,
								method: 'POST',
								body,
								headers: {
									'Accept': 'application/json',
									'Content-Type': 'application/json',
								},
								json: true,
								ignoreHttpStatusErrors: true,
							}
						);

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
							pairedItem: {
								item: i,
								input: 0
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
								pairedItem: {
									item: i,
									input: 0
								}
							});
							continue;
						}
						throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
					}
				}
			} else if (operation === 'getChatbotStatus') {
				// Handle getChatbotStatus operation
				for (let i = 0; i < items.length; i++) {
					try {
						const chatbotId = this.getNodeParameter('chatbot_id', i) as string;

						// Make the request
						const endpoint = `/chatbot/status/${chatbotId}`;

						const credentials = await this.getCredentials('chatDataApi');
						const baseUrl = credentials.baseUrl as string;
						const baseUrlFormatted = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
						const fullUrl = `${baseUrlFormatted}/api/v2${endpoint}`;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'chatDataApi',
							{
								url: fullUrl,
								method: 'GET',
								qs: {},
								headers: {
									'Accept': 'application/json',
									'Content-Type': 'application/json',
								},
								json: true,
								ignoreHttpStatusErrors: true,
							}
						);

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
						}

						// Return the response with proper paired item
						returnData.push({
							json: response,
							pairedItem: {
								item: i,
								input: 0
							}
						});
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
								pairedItem: {
									item: i,
									input: 0
								}
							});
							continue;
						}
						throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
					}
				}
			} else if (operation === 'createChatbot') {
				for (let i = 0; i < items.length; i++) {
					try {
						const chatbotName = this.getNodeParameter('chatbotName', i) as string;
						const model = this.getNodeParameter('model', i) as string;
						const sourceText = this.getNodeParameter('sourceText', i, '') as string;
						const urlsData = this.getNodeParameter('urlsToScrape.urlValues', i, []) as IDataObject[];

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
							const customBackend = this.getNodeParameter('customBackend', i, '') as string;
							const bearer = this.getNodeParameter('bearer', i, '') as string;

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

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'chatDataApi',
							{
								url: fullUrl,
								method: 'POST',
								body,
								headers: {
									'Accept': 'application/json',
									'Content-Type': 'application/json',
								},
								json: true,
								ignoreHttpStatusErrors: true,
							}
						);

						// Check for error
						if (response.status === 'error') {
							throw new NodeOperationError(this.getNode(), response.message, { itemIndex: i });
						}

						// Return the response with proper paired item
						returnData.push({
							json: response,
							pairedItem: {
								item: i,
								input: 0
							}
						});
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
								pairedItem: {
									item: i,
									input: 0
								}
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
