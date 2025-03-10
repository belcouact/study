document.addEventListener('DOMContentLoaded', () => {
    // Core elements that definitely exist
    const userInput = document.getElementById('user-input');
    const submitButton = document.getElementById('submit-button');
    const output = document.getElementById('output');
    const loading = document.getElementById('loading');
    const showDiagnosticsButton = document.getElementById('show-diagnostics');
    const diagnosticsPanel = document.getElementById('diagnostics-panel');
    const diagnosticsOutput = document.getElementById('diagnostics-output');
    
    // Optional elements - may not exist in all versions of the HTML
    const directTestButton = document.getElementById('direct-test-button');
    const simpleApiButton = document.getElementById('simple-api-button');
    const checkEnvButton = document.getElementById('check-env-button');
    const apiFunctionRadios = document.querySelectorAll('input[name="api-function"]');
    const fallbackButton = document.getElementById('fallback-button');
    const modelSelect = document.getElementById('model-select');

    let diagnosticsData = null;
    let currentApiFunction = 'chat'; // Updated to use the Cloudflare Pages function
    let lastQuestion = null;
    let currentModel = 'deepseek-r1';

    // API configuration
    // Note: These values are now for reference only and not actually used for API calls
    // The actual values are stored in Cloudflare Pages environment variables
    const API_BASE_URL = 'https://api.lkeap.cloud.tencent.com/v1';
    const MODEL = 'deepseek-r1';

    // Add event listener for the submit button
    submitButton.addEventListener('click', handleSubmit);
    
    // Add event listener for Enter key in the input field
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    });

    // Add event listener for the show diagnostics button
    showDiagnosticsButton.addEventListener('click', () => {
        if (diagnosticsPanel.classList.contains('hidden')) {
            diagnosticsPanel.classList.remove('hidden');
            showDiagnosticsButton.textContent = 'Hide Diagnostics';
        } else {
            diagnosticsPanel.classList.add('hidden');
            showDiagnosticsButton.textContent = 'Show Diagnostics';
        }
    });

    // Add event listeners for optional elements only if they exist
    if (directTestButton) {
        directTestButton.addEventListener('click', async () => {
            try {
                // Show loading state
                loading.classList.remove('hidden');
                
                const response = await fetch('/api/direct-test');
                const data = await response.json();
                
                // Hide loading state
                loading.classList.add('hidden');
                
                // Show diagnostics
                showDiagnosticsButton.classList.remove('hidden');
                diagnosticsPanel.classList.remove('hidden');
                diagnosticsOutput.textContent = JSON.stringify(data, null, 2);
                showDiagnosticsButton.textContent = 'Hide Diagnostics';
                
                console.log('Direct API test completed:', data);
            } catch (error) {
                // Hide loading state
                loading.classList.add('hidden');
                
                console.error('Direct API test failed:', error);
            }
        });
    }

    // Add event listener for the simple API button
    if (simpleApiButton) {
        simpleApiButton.addEventListener('click', async () => {
            const question = userInput.value.trim() || "Hello, how are you?";
            
            if (!question) {
                alert('Please enter a question first.');
                return;
            }
            
            try {
                // Show loading state
                loading.classList.remove('hidden');
                output.innerHTML = '';
                
                const response = await fetch('/api/simple-ai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ question })
                });
                
                const data = await response.json();
                console.log('Simple API response:', data);
                
                // Format and display the response
                const content = extractContentFromResponse(data);
                output.innerHTML = `<div class="ai-message">${formatResponse(content)}</div>`;
            } catch (error) {
                console.error('Simple API error:', error);
                output.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
            } finally {
                // Hide loading state
                loading.classList.add('hidden');
            }
        });
    }

    // Add event listener for the check environment button
    if (checkEnvButton) {
        checkEnvButton.addEventListener('click', async () => {
            try {
                // Show loading state
                loading.classList.remove('hidden');
                
                const response = await fetch('/api/check-env');
                const data = await response.json();
                
                // Hide loading state
                loading.classList.add('hidden');
                
                // Show diagnostics
                showDiagnosticsButton.classList.remove('hidden');
                diagnosticsPanel.classList.remove('hidden');
                diagnosticsOutput.textContent = JSON.stringify(data, null, 2);
                showDiagnosticsButton.textContent = 'Hide Diagnostics';
                
                if (data.status === 'ok') {
                    console.log('Environment check completed:', data);
                } else {
                    console.error('Environment check failed:', data);
                }
            } catch (error) {
                // Hide loading state
                loading.classList.add('hidden');
                
                console.error('Environment check failed:', error);
            }
        });
    }

    // Add event listeners for API function radio buttons
    if (apiFunctionRadios && apiFunctionRadios.length > 0) {
        apiFunctionRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentApiFunction = e.target.value;
                console.log('API function changed to:', currentApiFunction);
            });
        });
    }

    // Add event listener for model select if it exists
    if (modelSelect) {
        modelSelect.addEventListener('change', () => {
            currentModel = modelSelect.value;
            console.log('Model changed to:', currentModel);
        });
    }

    // Function to handle form submission
    async function handleSubmit() {
        const question = userInput.value.trim();
        
        if (!question) {
            alert('Please enter a question');
            return;
        }
        
        // Clear previous response
        output.innerHTML = '';
        
        // Show loading state
        loading.classList.remove('hidden');
        
        try {
            const data = await fetchAIResponse(question);
            
            // Hide loading state
            loading.classList.add('hidden');
            
            // Handle the response
            handleSuccessfulResponse(data, question);
            
        } catch (error) {
            // Hide loading state
            loading.classList.add('hidden');
            
            // Show error message
            output.innerHTML = `<div class="system-message error">
                <p>Sorry, I encountered an error: ${error.message}</p>
                <p>Please try again later or rephrase your question.</p>
            </div>`;
            
            console.error('Request failed:', error);
            
            // Show diagnostics button
            showDiagnosticsButton.classList.remove('hidden');
        }
        
        // Clear the input
        userInput.value = '';
    }
    
    // Helper function to handle successful responses
    function handleSuccessfulResponse(data, question) {
        // Update status (removed API status update)
        console.log('API response details:', data);
        
        // Extract and display content
        let content = extractContentFromResponse(data);
        
        output.innerHTML = `<div class="ai-message">${formatResponse(content)}</div>`;
        
        // Store the last question for retry functionality
        lastQuestion = question;
    }

    // Function to extract content from various response formats
    function extractContentFromResponse(data) {
        // Try to extract from standard OpenAI format
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const message = data.choices[0].message;
            if (message.content) return message.content;
        }
        
        // If we have a direct content field
        if (data.content) return data.content;
        
        // If we have a message field
        if (data.message && data.message.content) return data.message.content;
        
        // If we have a raw text field
        if (data.text) return data.text;
        
        // If we have a response field
        if (data.response) return data.response;
        
        // If we have a raw data object, stringify it
        return JSON.stringify(data, null, 2);
    }

    // Add this at the top of your script
    const responseCache = {};

    // Function to fetch AI response
    async function fetchAIResponse(question) {
        if (!question) throw new Error('Question is required');
        
        // Show loading state
        loading.classList.remove('hidden');
        
        try {
            // Create a cache key
            const cacheKey = `${currentApiFunction}:${question}`;
            
            // Check if we have a cached response
            if (responseCache[cacheKey]) {
                console.log('Using cached response');
                return responseCache[cacheKey];
            }
            
            // Create a controller for the timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout
            
            // Make the request
            const response = await fetch(`/api/${currentApiFunction}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    messages: [
                        { role: "user", content: question }
                    ]
                }),
                signal: controller.signal
            });
            
            // Clear the timeout
            clearTimeout(timeoutId);
            
            // Check if the response was successful
            if (!response.ok) {
                let errorMessage = `Error: ${response.status} ${response.statusText}`;
                
                try {
                    // Try to get more details from the error response
                    const errorData = await response.json();
                    if (errorData.error) errorMessage = errorData.error;
                } catch (e) {
                    // If we can't parse the error as JSON, just use the status message
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('API response data:', data);
            
            // Store the raw response for debugging
            lastRawResponse = data;
            
            // Extract content
            const content = extractContentFromResponse(data);
            
            // Cache the response
            responseCache[cacheKey] = content;
            
            return content;
        } catch (error) {
            console.error('Fetch error details:', error);
            
            // Check for timeout/abort errors
            if (error.name === 'AbortError') {
                return "The request took too long and was aborted. Please try again or try a different question.";
            }
            
            throw error;
        } finally {
            // Hide loading state
            loading.classList.add('hidden');
        }
    }

    // Function to escape HTML special characters
    function escapeHTML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Function to format the response with proper line breaks and formatting
    function formatResponse(text) {
        if (!text) return '';
        
        // Escape HTML special characters
        let escapedText = escapeHTML(text);
        
        // Handle Chinese poetry formatting
        if (escapedText.includes('《') && escapedText.includes('》')) {
            // Replace double newlines with paragraph breaks
            escapedText = escapedText.replace(/\n\n/g, '</p><p>');
            
            // Replace single newlines with line breaks
            escapedText = escapedText.replace(/\n/g, '<br>');
            
            // Wrap in paragraphs
            escapedText = `<p>${escapedText}</p>`;
            
            // Add poetry class for styling
            return `<div class="poetry">${escapedText}</div>`;
        }
        
        // Regular formatting for non-poetry text
        return escapedText
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.+)$/gm, '$1')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^\s*[-*+] (.*)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
            .replace(/<\/ul><ul>/g, '')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    // Add event listener for the fallback button
    if (fallbackButton) {
        fallbackButton.addEventListener('click', async () => {
            const question = userInput.value.trim();
            if (!question) {
                alert('Please enter a question first.');
                return;
            }
            
            try {
                // Show loading state
                loading.classList.remove('hidden');
                output.innerHTML = '';
                
                // Generate a local fallback response
                const response = generateLocalResponse(question);
                
                // Format and display the response
                const formattedResponse = formatResponse(response);
                output.innerHTML = `<div class="ai-message">${formattedResponse}</div>`;
            } catch (error) {
                console.error('Error generating fallback response:', error);
                output.innerHTML = `<div class="error-message">Error: ${escapeHTML(error.message)}</div>`;
            } finally {
                // Hide loading state
                loading.classList.add('hidden');
            }
        });
    }

    // Function to generate a local response
    function generateLocalResponse(question) {
        question = question.toLowerCase();
        
        // Simple pattern matching for common questions
        if (question.includes('hello') || question.includes('hi ') || question.includes('hey')) {
            return "Hello! I'm a local fallback assistant. The main AI service is currently unavailable, but I can help with basic questions.";
        }
        
        if (question.includes('how are you')) {
            return "I'm functioning as a fallback service since the main AI is unavailable. I can only provide simple responses.";
        }
        
        if (question.includes('thank')) {
            return "You're welcome! I'm happy to help, even in fallback mode. Please try again later when the main AI service is available for more comprehensive assistance.";
        }
        
        if (question.includes('help') || question.includes('can you')) {
            return `I'm currently in fallback mode with limited capabilities. Here's what I can help with:
            
1. Basic greetings and simple responses
2. Suggesting resources for your questions
3. Explaining why the main service might be unavailable

For more complex assistance, please try again later when the main AI service is available.`;
        }
        
        if (question.includes('what time') || question.includes('date') || question.includes('today')) {
            const now = new Date();
            return `I'm in fallback mode, but I can tell you that the current date and time on your device is: ${now.toLocaleString()}`;
        }
        
        if (question.includes('what is') || question.includes('who is') || question.includes('explain') || question.includes('how to') || question.includes('why')) {
            const searchTerm = question
                .replace(/what is|who is|explain|how to|why/gi, '')
                .replace(/\?/g, '')
                .trim();
                
            return `I'm sorry, I can't provide detailed information about "${searchTerm}" in fallback mode. 

You might want to try:
1. Searching for "${searchTerm}" on Google
2. Checking Wikipedia for information about "${searchTerm}"
3. Looking for tutorials on YouTube if you're trying to learn how to do something
4. Trying again later when the main AI service is available`;
        }
        
        // Check for math-related questions
        if (/[0-9+\-*\/=]/.test(question)) {
            return `It looks like you might be asking about a calculation. In fallback mode, I can't perform calculations, but you can:

1. Use your device's calculator app
2. Try Google's calculator by typing your expression in the search bar
3. Try again later when the main AI service is available`;
        }
        
        // Default response
        return `I'm currently operating in fallback mode because the main AI service is unavailable or timed out. 

The API connection issue could be due to:
1. The API server might be experiencing high traffic or temporary issues
2. The request might be taking longer than the allowed time limit (10 seconds)
3. There might be network connectivity issues

Your question was: "${question}"

While I can't provide a detailed answer right now, you might want to:
1. Try again with a simpler or shorter question
2. Try again later when the service might be less busy
3. Search for this information on Google
4. Contact the site administrator if the problem persists`;
    }

    // Function to call the streaming API endpoint
    async function callStreamingAPI(prompt, outputElement) {
        try {
            // Clear previous content
            outputElement.innerHTML = '';
            outputElement.classList.add('loading');
            
            // Create a loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.textContent = 'Connecting to AI...';
            outputElement.appendChild(loadingIndicator);
            
            // Try the edge function first
            try {
                console.log('Trying edge function...');
                // Make the API call to the edge function
                const response = await fetch('/api/streaming-ai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt }),
                });
                
                if (!response.ok) {
                    throw new Error(`Edge function error: ${response.status}`);
                }
                
                // Remove loading indicator
                outputElement.removeChild(loadingIndicator);
                outputElement.classList.remove('loading');
                
                // Check the content type to determine if we got a streaming response or a fallback JSON response
                const contentType = response.headers.get('Content-Type');
                
                if (contentType && contentType.includes('application/json')) {
                    // This is a fallback response from the regular function
                    console.log('Received fallback response (non-streaming)');
                    const data = await response.json();
                    
                    // Display the content
                    if (data.content) {
                        outputElement.innerHTML = formatResponse(data.content);
                    } else {
                        outputElement.innerHTML = `<div class="system-message">
                            <p>Received a fallback response without content.</p>
                            <pre>${JSON.stringify(data, null, 2)}</pre>
                        </div>`;
                    }
                    
                    return;
                }
                
                // If we get here, we have a streaming response
                console.log('Processing streaming response');
                
                // Set up a reader for the stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let formattedOutput = '';
                
                // Process the stream
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    // Decode the chunk and add to buffer
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Process SSE format (data: lines)
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6); // Remove 'data: ' prefix
                            
                            // Check if it's the [DONE] message
                            if (data.trim() === '[DONE]') continue;
                            
                            try {
                                // Parse the JSON data
                                const parsed = JSON.parse(data);
                                
                                // Extract the content if it exists
                                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                    const content = parsed.choices[0].delta.content;
                                    formattedOutput += content;
                                    
                                    // Format and display the accumulated output
                                    outputElement.innerHTML = formatResponse(formattedOutput);
                                }
                            } catch (e) {
                                console.error('Error parsing JSON:', e);
                            }
                        }
                    }
                }
                
                // Process any remaining data
                if (buffer.length > 0) {
                    const lines = buffer.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                    const content = parsed.choices[0].delta.content;
                                    formattedOutput += content;
                                    
                                    // Format and display the accumulated output
                                    outputElement.innerHTML = formatResponse(formattedOutput);
                                }
                            } catch (e) {
                                console.error('Error parsing JSON:', e);
                            }
                        }
                    }
                }
                
                // If we didn't get any content, show an error
                if (!formattedOutput) {
                    console.warn('No content received from streaming response');
                    outputElement.innerHTML = `<div class="system-message">
                        <p>No content was received from the streaming API.</p>
                        <p>This might be due to an issue with the streaming connection or the API response format.</p>
                    </div>`;
                }
                
                // Streaming completed
                
                // Enable the submit button
                submitButton.disabled = false;
                
                // Hide loading indicator
                loading.classList.add('hidden');
                
                return;
            } catch (edgeError) {
                console.error('Edge function failed:', edgeError);
                // Continue to try the regular function
            }
            
            // If we get here, the edge function failed, so try the regular function
            console.log('Trying regular function test...');
            const fallbackResponse = await fetch('/api/test');
            
            // Remove loading indicator
            outputElement.removeChild(loadingIndicator);
            outputElement.classList.remove('loading');
            
            if (!fallbackResponse.ok) {
                throw new Error(`Regular function test failed: ${fallbackResponse.status}`);
            }
            
            const fallbackData = await fallbackResponse.json();
            
            console.log('Regular function test results:', fallbackData);
            
            // Show diagnostics
            showDiagnosticsButton.classList.remove('hidden');
            diagnosticsPanel.classList.remove('hidden');
            diagnosticsOutput.textContent = JSON.stringify({
                ...fallbackData,
                note: "Edge function failed, using regular function instead.",
                troubleshooting_tips: [
                    "Check if Cloudflare Pages Functions are enabled for your site",
                    "Check your function code for errors",
                    "Check the Cloudflare Pages logs for any deployment errors",
                    "Make sure your Cloudflare Pages site is properly configured"
                ]
            }, null, 2);
            showDiagnosticsButton.textContent = 'Hide Diagnostics';
            
        } catch (error) {
            console.error('Streaming error:', error);
            
            // Show timeout message if it was a timeout
            if (error.name === 'AbortError') {
                outputElement.innerHTML += `<div class="system-message warning">
                    <p>The request is taking longer than expected. Please wait...</p>
                </div>`;
                
                // Try again with non-streaming API
                try {
                    const data = await fetchAIResponse(prompt);
                    handleSuccessfulResponse(data, prompt);
                } catch (fallbackError) {
                    outputElement.innerHTML = `<div class="system-message error">
                        <p>Sorry, I encountered an error: ${fallbackError.message}</p>
                        <p>Please try again later or rephrase your question.</p>
                    </div>`;
                }
            } 
            
            // Enable the submit button
            submitButton.disabled = false;
            
            // Hide loading indicator
            loading.classList.add('hidden');
        }
    }

    // Add event listener for the test edge function button
    const testEdgeButton = document.getElementById('test-edge-button');
    if (testEdgeButton) {
        testEdgeButton.addEventListener('click', async () => {
            try {
                apiStatus.textContent = 'Testing edge function...';
                apiStatus.className = 'status-checking';
                
                // Try the edge function first
                try {
                    const response = await fetch('/api/test-edge');
                    
                    if (!response.ok) {
                        throw new Error(`Edge function test failed: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    console.log('Edge function test results:', data);
                    
                    // Show diagnostics
                    showDiagnosticsButton.classList.remove('hidden');
                    diagnosticsPanel.classList.remove('hidden');
                    diagnosticsOutput.textContent = JSON.stringify(data, null, 2);
                    showDiagnosticsButton.textContent = 'Hide Diagnostics';
                    
                    apiStatus.textContent = 'Edge function is working!';
                    apiStatus.className = 'status-success';
                    return;
                } catch (edgeError) {
                    console.error('Edge function test failed:', edgeError);
                    // Continue to try the regular function
                }
                
                // If we get here, the edge function failed, so try the regular function
                console.log('Trying regular function test...');
                const fallbackResponse = await fetch('/api/test');
                
                if (!fallbackResponse.ok) {
                    throw new Error(`Regular function test failed: ${fallbackResponse.status}`);
                }
                
                const fallbackData = await fallbackResponse.json();
                
                console.log('Regular function test results:', fallbackData);
                
                // Show diagnostics
                showDiagnosticsButton.classList.remove('hidden');
                diagnosticsPanel.classList.remove('hidden');
                diagnosticsOutput.textContent = JSON.stringify({
                    ...fallbackData,
                    note: "Edge function failed, using regular function instead.",
                    troubleshooting_tips: [
                        "Check if Cloudflare Pages Functions are enabled for your site",
                        "Check your function code for errors",
                        "Check the Cloudflare Pages logs for any deployment errors",
                        "Make sure your Cloudflare Pages site is properly configured"
                    ]
                }, null, 2);
                showDiagnosticsButton.textContent = 'Hide Diagnostics';
                
                apiStatus.textContent = 'Regular function is working (Edge function failed)';
                apiStatus.className = 'status-warning';
                
            } catch (error) {
                apiStatus.textContent = `All function tests failed: ${error.message}`;
                apiStatus.className = 'status-error';
                console.error('Function test error:', error);
                
                // Show diagnostics
                showDiagnosticsButton.classList.remove('hidden');
                diagnosticsPanel.classList.remove('hidden');
                diagnosticsOutput.textContent = JSON.stringify({ 
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString(),
                    troubleshooting_tips: [
                        "Check if Cloudflare Pages Functions are enabled for your site",
                        "Check your function code for errors",
                        "Check the Cloudflare Pages logs for any deployment errors",
                        "Make sure your Cloudflare Pages site is properly configured"
                    ]
                }, null, 2);
                showDiagnosticsButton.textContent = 'Hide Diagnostics';
            }
        });
    }
}); 