import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
	IHttpRequestOptions,
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
			} else if (operation === 'makeApiCall') {
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

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'chatDataApi',
						requestOptions
					);

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
						pairedItem: {
							item: 0,
							input: 0
						}
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
							},
							pairedItem: {
								item: 0,
								input: 0
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
				try {
					const chatbotId = this.getNodeParameter('chatbot_id', 0) as string;

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
						throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
					}

					// Return the full response as a single item
					return [[{
						json: response,
						pairedItem: {
							item: 0,
							input: 0
						}
					}]];
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
							json: { error: errorMessage },
							pairedItem: {
								item: 0,
								input: 0
							}
						}]];
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
						throw new NodeOperationError(this.getNode(), response.message, { itemIndex: 0 });
					}

					// Return the response
					return [[{
						json: response,
						pairedItem: {
							item: 0,
							input: 0
						}
					}]];
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
							json: { error: errorMessage },
							pairedItem: {
								item: 0,
								input: 0
							}
						}]];
					}
					throw error;
				}
			}
		}

		return [returnData.length ? returnData : items];
	}
}
