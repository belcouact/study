// Add this code at the very beginning of the file, right after any initial comments

// Immediately executing function to initialize dropdowns with empty values
(function() {
    // Create a function that will run as soon as the DOM is ready
    function initializeEmptyDropdowns() {
        console.log('EARLY INITIALIZATION: Setting empty values for all dropdowns');
        
        // Get all select elements in the document
        const allDropdowns = document.querySelectorAll('select');
        
        // For each dropdown, add an empty option and set it as selected
        allDropdowns.forEach(dropdown => {
            // Skip if this is not a form dropdown we care about
            if (!dropdown.id || 
                (!dropdown.id.includes('school') && 
                 !dropdown.id.includes('grade') && 
                 !dropdown.id.includes('subject') && 
                 !dropdown.id.includes('semester') && 
                 !dropdown.id.includes('difficulty') && 
                 !dropdown.id.includes('count'))) {
                return;
            }
            
            console.log(`EARLY INITIALIZATION: Setting empty value for ${dropdown.id}`);
            
            // Check if an empty option already exists
            let emptyOption = Array.from(dropdown.options).find(option => option.value === '');
            
            // If no empty option exists, create one
            if (!emptyOption) {
                emptyOption = document.createElement('option');
                emptyOption.value = '';
                
                // Set appropriate text based on dropdown type
                if (dropdown.id.includes('school')) {
                    emptyOption.textContent = '请选择学校';
                } else if (dropdown.id.includes('grade')) {
                    emptyOption.textContent = '请选择年级';
                } else if (dropdown.id.includes('subject')) {
                    emptyOption.textContent = '请选择科目';
                } else if (dropdown.id.includes('semester')) {
                    emptyOption.textContent = '请选择学期';
                } else if (dropdown.id.includes('difficulty')) {
                    emptyOption.textContent = '请选择难度';
                } else if (dropdown.id.includes('count')) {
                    emptyOption.textContent = '请选择题数';
                }
                
                // Insert at the beginning
                dropdown.insertBefore(emptyOption, dropdown.firstChild);
            }
            
            // Force select the empty option
            dropdown.value = '';
            
            // Dispatch a change event to ensure any listeners are notified
            const event = new Event('change', { bubbles: true });
            dropdown.dispatchEvent(event);
        });
    }
    
    // Run immediately if DOM is already loaded
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        initializeEmptyDropdowns();
    } else {
        // Otherwise wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', initializeEmptyDropdowns);
    }
    
    // Also run after a short delay to catch any dynamically created dropdowns
    setTimeout(initializeEmptyDropdowns, 100);
    setTimeout(initializeEmptyDropdowns, 500);
    setTimeout(initializeEmptyDropdowns, 1000);
})();

// Override the populateGradeOptions and populateSubjectOptions functions
// to ensure they always include an empty option
const originalPopulateGradeOptions = window.populateGradeOptions || function() {};
window.populateGradeOptions = function(school) {
    // Call the original function
    originalPopulateGradeOptions(school);
    
    // Get both the form and sidebar grade dropdowns
    const gradeDropdown = document.getElementById('grade');
    const sidebarGradeDropdown = document.getElementById('sidebar-grade');
    
    // Ensure empty option exists and is selected for both dropdowns
    [gradeDropdown, sidebarGradeDropdown].forEach(dropdown => {
        if (!dropdown) return;
        
        // Check if an empty option already exists
        let emptyOption = Array.from(dropdown.options).find(option => option.value === '');
        
        // If no empty option exists, create one
        if (!emptyOption) {
            emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '请选择年级';
            dropdown.insertBefore(emptyOption, dropdown.firstChild);
        }
        
        // Force select the empty option if no value is currently selected
        if (!dropdown.value) {
            dropdown.value = '';
        }
    });
};

const originalPopulateSubjectOptions = window.populateSubjectOptions || function() {};
window.populateSubjectOptions = function(school) {
    // Call the original function
    originalPopulateSubjectOptions(school);
    
    // Get both the form and sidebar subject dropdowns
    const subjectDropdown = document.getElementById('subject');
    const sidebarSubjectDropdown = document.getElementById('sidebar-subject');
    
    // Ensure empty option exists and is selected for both dropdowns
    [subjectDropdown, sidebarSubjectDropdown].forEach(dropdown => {
        if (!dropdown) return;
        
        // Check if an empty option already exists
        let emptyOption = Array.from(dropdown.options).find(option => option.value === '');
        
        // If no empty option exists, create one
        if (!emptyOption) {
            emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '请选择科目';
            dropdown.insertBefore(emptyOption, dropdown.firstChild);
        }
        
        // Force select the empty option if no value is currently selected
        if (!dropdown.value) {
            dropdown.value = '';
        }
    });
};

// API configuration variables
let currentApiFunction = 'chat';
let currentModel = 'deepseek-r1';

// Function to parse questions from API response
function parseQuestionsFromResponse(response) {
    console.log('Parsing questions from response:', response);
    
    // Extract content from the API response
    const content = extractContentFromResponse(response);
    if (!content) {
        console.error('No content found in response');
        return [];
    }
    
    console.log('Extracted content:', content);
    const parsedQuestions = [];
    
    // Check if the content already contains "题目：" marker
    let contentToProcess = content;
    if (!content.includes('题目：') && !content.startsWith('题目')) {
        // If not, add it to make parsing consistent
        contentToProcess = '题目：' + content;
    }
    
    // Split the content by "题目："
    const questionBlocks = contentToProcess.split(/题目：/).filter(block => block.trim());
    console.log(`Found ${questionBlocks.length} question blocks`);
    
    if (questionBlocks.length === 0) {
        // If no question blocks found with standard format, try alternative parsing
        console.log('Attempting alternative parsing method');
        
        // Look for numbered questions like "1." or "Question 1:"
        const altQuestionBlocks = content.split(/\d+[\.\:]\s+/).filter(block => block.trim());
        
        if (altQuestionBlocks.length > 0) {
            console.log(`Found ${altQuestionBlocks.length} alternative question blocks`);
            
            for (const block of altQuestionBlocks) {
                try {
                    // Try to extract choices, answer and explanation with more flexible patterns
                    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
                    
                    if (lines.length < 5) continue; // Need at least question + 4 choices
                    
                    const questionText = lines[0];
                    let choiceA = '', choiceB = '', choiceC = '', choiceD = '';
                    let answer = '';
                    let explanation = '';
                    
                    // Look for choices
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.startsWith('A') || line.startsWith('A.') || line.startsWith('(A)')) {
                            choiceA = line.replace(/^A\.?\s*|\(A\)\s*/, '');
                        } else if (line.startsWith('B') || line.startsWith('B.') || line.startsWith('(B)')) {
                            choiceB = line.replace(/^B\.?\s*|\(B\)\s*/, '');
                        } else if (line.startsWith('C') || line.startsWith('C.') || line.startsWith('(C)')) {
                            choiceC = line.replace(/^C\.?\s*|\(C\)\s*/, '');
                        } else if (line.startsWith('D') || line.startsWith('D.') || line.startsWith('(D)')) {
                            choiceD = line.replace(/^D\.?\s*|\(D\)\s*/, '');
                        } else if (line.includes('答案') || line.toLowerCase().includes('answer')) {
                            answer = line.match(/[A-D]/)?.[0] || '';
                        } else if (line.includes('解析') || line.toLowerCase().includes('explanation')) {
                            explanation = lines.slice(i).join('\n');
                            break;
                        }
                    }
                    
                    if (questionText && (choiceA || choiceB || choiceC || choiceD)) {
                        parsedQuestions.push({
                            questionText: `题目：${questionText}`,
                            choices: {
                                A: choiceA || '选项A',
                                B: choiceB || '选项B',
                                C: choiceC || '选项C',
                                D: choiceD || '选项D'
                            },
                            answer: answer || 'A',
                            explanation: explanation || '无解析'
                        });
                    }
                } catch (error) {
                    console.error('Error parsing alternative question block:', error, block);
                }
            }
        }
    }
    
    // Standard parsing for normal format
    for (const block of questionBlocks) {
        try {
            console.log('Processing question block:', block.substring(0, 100) + '...');
            
            // Extract question text
            const questionText = block.split(/[A-D]\.|\n答案：|\n解析：/)[0].trim();
            console.log('Extracted question text:', questionText);
            
            // Extract choices
            const choiceA = block.match(/A\.(.*?)(?=B\.|$)/s)?.[1]?.trim() || '';
            const choiceB = block.match(/B\.(.*?)(?=C\.|$)/s)?.[1]?.trim() || '';
            const choiceC = block.match(/C\.(.*?)(?=D\.|$)/s)?.[1]?.trim() || '';
            const choiceD = block.match(/D\.(.*?)(?=\n答案：|$)/s)?.[1]?.trim() || '';
            
            console.log('Extracted choices:', { A: choiceA, B: choiceB, C: choiceC, D: choiceD });
            
            // Extract answer
            const answer = block.match(/答案：([A-D])/)?.[1] || '';
            console.log('Extracted answer:', answer);
            
            // Extract explanation
            const explanation = block.match(/解析：([\s\S]*?)(?=题目：|$)/)?.[1]?.trim() || '';
            console.log('Extracted explanation:', explanation.substring(0, 100) + '...');
            
            if (!questionText || !answer) {
                console.warn('Skipping question with missing text or answer');
                continue;
            }
            
            parsedQuestions.push({
                questionText: `题目：${questionText}`,
                choices: {
                    A: choiceA || '选项A未提供',
                    B: choiceB || '选项B未提供',
                    C: choiceC || '选项C未提供',
                    D: choiceD || '选项D未提供'
                },
                answer: answer,
                explanation: explanation || '无解析'
            });
        } catch (error) {
            console.error('Error parsing question block:', error, block);
        }
    }
    
    // If we still have no questions, create a default one to prevent errors
    if (parsedQuestions.length === 0) {
        console.warn('No questions could be parsed, creating a default question');
        parsedQuestions.push({
            questionText: '题目：无法解析API返回的题目，这是一个默认题目',
            choices: {
                A: '选项A',
                B: '选项B',
                C: '选项C',
                D: '选项D'
            },
            answer: 'A',
            explanation: '由于API返回格式问题，无法解析题目。这是一个默认解析。'
        });
    }
    
    console.log(`Successfully parsed ${parsedQuestions.length} questions:`, parsedQuestions);
    return parsedQuestions;
}

// Global function to fetch AI response for question generation
async function fetchAIResponse(prompt) {
    console.log('Fetching AI response with prompt:', prompt);
    
    try {
        // Show loading indicator if it exists
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
        
        // Make the actual API call using the current API function and model
        const apiEndpoint = `/api/${currentApiFunction}`;
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: currentModel,
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response:', data);
        return data;
        
    } catch (error) {
        console.error('Error in fetchAIResponse:', error);
        throw error; // Re-throw the error to be handled by the caller
    } finally {
        // Hide loading indicator if it exists
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
}

// Function to extract content from API response
function extractContentFromResponse(data) {
    console.log('Extracting content from response:', data);
    
    try {
        // Handle different API response formats
        if (data.choices && data.choices[0]) {
            if (data.choices[0].message && data.choices[0].message.content) {
                // OpenAI-like format
                return data.choices[0].message.content;
            } else if (data.choices[0].content) {
                // Deepseek format
                return data.choices[0].content;
            }
        } else if (data.response) {
            // Simple API format
            return data.response;
        } else if (data.content) {
            // Direct content format
            return data.content;
        } else if (typeof data === 'string') {
            // Already a string
            return data;
        } else {
            // Try to find content in the response
            const possibleContentFields = ['text', 'answer', 'result', 'output', 'generated_text'];
            for (const field of possibleContentFields) {
                if (data[field]) {
                    return data[field];
                }
            }
            
            // If all else fails, stringify the entire response
            console.warn('Could not extract content from response, using stringified response');
            return JSON.stringify(data);
        }
    } catch (error) {
        console.error('Error extracting content from response:', error);
        return '';
    }
}

// Function to show results popup
function showResultsPopup() {
    // Calculate score
    let correctCount = 0;
    window.userAnswers.forEach((answer, index) => {
        if (answer === window.questions[index].answer) {
            correctCount++;
        }
    });
    const scorePercentage = (correctCount / window.questions.length) * 100;

    // Create modal container
    let modalContainer = document.getElementById('results-modal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'results-modal';
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        document.body.appendChild(modalContainer);
    }

    // Create modal content
    modalContainer.innerHTML = `
        <div class="modal-content" style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        ">
            <button id="close-modal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #4a5568;
                padding: 5px;
                z-index: 1;
            ">×</button>
            
            <div style="
                text-align: center;
                margin-bottom: 25px;
            ">
                <h2 style="
                    font-size: clamp(24px, 4vw, 28px);
                    color: #2d3748;
                    margin-bottom: 20px;
                ">测试完成！</h2>
                
                <div style="
                    font-size: clamp(16px, 3vw, 18px);
                    color: #4a5568;
                    margin-bottom: 25px;
                ">
                    总题数: ${window.questions.length} | 
                    正确: ${correctCount} | 
                    正确率: ${scorePercentage.toFixed(1)}%
                </div>
                
                <button id="evaluate-button" style="
                    padding: 12px 25px;
                    font-size: clamp(14px, 2.5vw, 16px);
                    font-weight: 500;
                    background-color: #4299e1;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(66, 153, 225, 0.2);
                ">成绩评估</button>
            </div>
            
            <div id="evaluation-result" style="
                display: none;
                margin-top: 20px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
                opacity: 0;
                transition: opacity 0.3s ease;
            "></div>
        </div>
    `;

    // Add event listeners
    const closeButton = document.getElementById('close-modal');
    const evaluateButton = document.getElementById('evaluate-button');

    closeButton.addEventListener('click', () => {
        modalContainer.remove();
    });

    evaluateButton.addEventListener('click', handleEvaluateClick);

    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            modalContainer.remove();
        }
    });
}

// Function to display the current question
function displayCurrentQuestion() {
    console.log('Displaying current question:', currentQuestionIndex);
    
    if (!questions || questions.length === 0 || currentQuestionIndex === undefined) {
        console.error('No questions available or currentQuestionIndex is undefined');
        return;
    }
    
    // Get the current question
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        console.error('Current question is undefined');
        return;
    }
    
    // Get the create container
    const createContainer = document.getElementById('create-container');
    if (!createContainer) {
        console.error('Create container not found');
        return;
    }
    
    // Get or create the questions display container
    let questionsDisplayContainer = document.querySelector('.questions-display-container');
    if (!questionsDisplayContainer) {
        questionsDisplayContainer = document.createElement('div');
        questionsDisplayContainer.className = 'questions-display-container';
        createContainer.appendChild(questionsDisplayContainer);
    }
    
    // Clear the container
    questionsDisplayContainer.innerHTML = '';
    
    // Get educational context from sidebar dropdowns
    const schoolDropdown = document.getElementById('sidebar-school');
    const gradeDropdown = document.getElementById('sidebar-grade');
    const subjectDropdown = document.getElementById('sidebar-subject');
    
    const school = schoolDropdown ? schoolDropdown.value : '';
    const grade = gradeDropdown ? gradeDropdown.value : '';
    const subject = subjectDropdown ? subjectDropdown.value : '';
    
    // Create educational context badge if context is available
    let contextBadge = '';
    if (school || grade || subject) {
        const contextParts = [];
        if (school) contextParts.push(school);
        if (grade) contextParts.push(grade);
        if (subject) contextParts.push(subject);
        
        contextBadge = `
            <div class="context-badge">
                ${contextParts.join(' · ')}
            </div>
        `;
    }
    
    // Create the question counter
    const questionCounter = document.createElement('div');
    questionCounter.className = 'question-counter';
    questionCounter.innerHTML = `
        ${contextBadge}
        <span>第 ${currentQuestionIndex + 1} 题 / 共 ${questions.length} 题</span>
    `;
    questionsDisplayContainer.appendChild(questionCounter);
    
    // Create the question text
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.innerHTML = formatMathExpressions(currentQuestion.question);
    questionsDisplayContainer.appendChild(questionText);
    
    // Create the choices container
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'choices-container';
    questionsDisplayContainer.appendChild(choicesContainer);
    
    // Add the choices
    const choices = currentQuestion.choices;
    const choiceLabels = ['A', 'B', 'C', 'D'];
    
    choices.forEach((choice, index) => {
        const choiceCell = document.createElement('div');
        choiceCell.className = 'choice-cell';
        choiceCell.setAttribute('data-value', choiceLabels[index]);
        
        const choiceLabel = document.createElement('div');
        choiceLabel.className = 'choice-label';
        choiceLabel.textContent = choiceLabels[index];
        
        const choiceContent = document.createElement('div');
        choiceContent.className = 'choice-content';
        choiceContent.innerHTML = formatMathExpressions(choice);
        
        choiceCell.appendChild(choiceLabel);
        choiceCell.appendChild(choiceContent);
        choicesContainer.appendChild(choiceCell);
        
        // Add click event to select the choice
        choiceCell.addEventListener('click', function() {
            // Update all cells
            const allCells = document.querySelectorAll('.choice-cell');
            allCells.forEach(cell => {
                cell.classList.remove('selected');
            });
            
            // Select this cell
            this.classList.add('selected');
            
            // Enable the submit button if it exists
            const submitButton = document.getElementById('submit-button');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('disabled');
            }
        });
    });
    
    // Create the answer container (initially hidden)
    const answerContainer = document.createElement('div');
    answerContainer.className = 'answer-container hidden';
    questionsDisplayContainer.appendChild(answerContainer);
    
    // Create the navigation controls
    const navigationControls = document.createElement('div');
    navigationControls.className = 'navigation-controls';
    
    // Create the action buttons container
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    
    // Create the optimize button
    const optimizeButton = document.createElement('button');
    optimizeButton.id = 'optimize-button';
    optimizeButton.className = 'action-button optimize-button';
    optimizeButton.innerHTML = '<i class="fas fa-magic"></i> 优化问题';
    actionButtons.appendChild(optimizeButton);
    
    // Create the submit button
    const submitButton = document.createElement('button');
    submitButton.id = 'submit-button';
    submitButton.className = 'action-button submit-button';
    submitButton.innerHTML = '<i class="fas fa-check"></i> 提交答案';
    actionButtons.appendChild(submitButton);
    
    // Add action buttons to navigation controls
    navigationControls.appendChild(actionButtons);
    
    // Create the navigation buttons
    const navigationButtons = document.createElement('div');
    navigationButtons.className = 'navigation-buttons';
    
    // Create the previous button
    const prevButton = document.createElement('button');
    prevButton.id = 'prev-button';
    prevButton.className = 'nav-button prev-button';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> 上一题';
    prevButton.disabled = currentQuestionIndex === 0;
    navigationButtons.appendChild(prevButton);
    
    // Create the next button
    const nextButton = document.createElement('button');
    nextButton.id = 'next-button';
    nextButton.className = 'nav-button next-button';
    nextButton.innerHTML = '下一题 <i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentQuestionIndex === questions.length - 1;
    navigationButtons.appendChild(nextButton);
    
    // Add navigation buttons to navigation controls
    navigationControls.appendChild(navigationButtons);
    
    // Add navigation controls to the container
    questionsDisplayContainer.appendChild(navigationControls);
    
    // Make the container visible
    questionsDisplayContainer.classList.remove('hidden');
    
    // Set up the option buttons
    setupOptionButtons();
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Render math expressions
    if (window.MathJax) {
        window.MathJax.typesetPromise && window.MathJax.typesetPromise();
    } else {
        // If MathJax is not loaded, try to load it
        if (!document.getElementById('mathjax-script')) {
            const script = document.createElement('script');
            script.id = 'mathjax-script';
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            script.async = true;
            document.head.appendChild(script);
            
            script.onload = function() {
                window.MathJax = {
                    tex: {
                        inlineMath: [['\\(', '\\)']],
                        displayMath: [['\\[', '\\]']]
                    },
                    svg: {
                        fontCache: 'global'
                    }
                };
                
                // Typeset the math after MathJax is loaded
                window.MathJax.typesetPromise && window.MathJax.typesetPromise();
            };
        }
    }
    
    console.log('displayCurrentQuestion completed');
}

// Function to format math expressions
function formatMathExpressions(text) {
    if (!text) return '';
    
    // Don't process text that already contains properly formatted LaTeX
    if (text.includes('\\(') && text.includes('\\)')) {
        return text;
    }
    
    // Replace LaTeX-style expressions with proper LaTeX delimiters
    // This handles expressions like \( g' = \frac{GM}{(R+h)^2} \)
    text = text.replace(/\\\( (.*?) \\\)/g, '\\($1\\)');
    
    // Replace simple math expressions with LaTeX
    text = text.replace(/\b(\d+[+\-*/]\d+)\b/g, '\\($1\\)');
    
    // Replace fractions written as a/b
    text = text.replace(/(\d+)\/(\d+)/g, '\\(\\frac{$1}{$2}\\)');
    
    // Replace powers written as a^b
    text = text.replace(/(\d+)\^(\d+)/g, '\\($1^{$2}\\)');
    
    // Replace square roots
    text = text.replace(/sqrt\(([^)]+)\)/g, '\\(\\sqrt{$1}\\)');
    
    // Replace existing LaTeX delimiters
    text = text.replace(/\$\$(.*?)\$\$/g, '\\[$1\\]');
    text = text.replace(/\$(.*?)\$/g, '\\($1\\)');
    
    return text;
}

// Global function to update navigation buttons
function updateNavigationButtons() {
    console.log('updateNavigationButtons called', window.currentQuestionIndex, window.questions ? window.questions.length : 0);
    
    const prevButton = document.getElementById('prev-question-button');
    const nextButton = document.getElementById('next-question-button');
    
    if (prevButton) {
        prevButton.disabled = !window.questions || window.currentQuestionIndex <= 0;
    }
    
    if (nextButton) {
        nextButton.disabled = !window.questions || window.currentQuestionIndex >= window.questions.length - 1;
    }

    // Update navigation buttons for mobile
    if (prevButton && nextButton) {
        const buttonStyle = `
            padding: clamp(8px, 3vw, 12px) clamp(15px, 4vw, 25px);
            font-size: clamp(14px, 3.5vw, 16px);
            border-radius: 8px;
            margin: clamp(5px, 2vw, 10px);
        `;
        prevButton.style.cssText += buttonStyle;
        nextButton.style.cssText += buttonStyle;
    }
    
    // Check if all questions are answered and display completion status
    if (window.userAnswers && window.questions) {
        const allQuestionsAnswered = window.userAnswers.length === window.questions.length && 
                                   window.userAnswers.every(answer => answer !== null);
        
        if (allQuestionsAnswered) {
            displayCompletionStatus();
        }
    }
}

// Function to display completion status and score in navigation section
function displayCompletionStatus() {
    // Calculate score
    let correctCount = 0;
    window.userAnswers.forEach((answer, index) => {
        if (answer === window.questions[index].answer) {
            correctCount++;
        }
    });
    const scorePercentage = (correctCount / window.questions.length) * 100;
    
    // Get or create navigation controls
    let navigationControls = document.querySelector('.navigation-controls');
    if (!navigationControls) {
        navigationControls = document.createElement('div');
        navigationControls.className = 'navigation-controls';
        navigationControls.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 20px 0;
            width: 100%;
            flex-wrap: wrap;
        `;
        
        const questionsDisplayContainer = document.getElementById('questions-display-container');
        if (questionsDisplayContainer) {
            questionsDisplayContainer.appendChild(navigationControls);
        }
    }
    
    // Check if completion status already exists
    let completionStatus = document.getElementById('completion-status');
    if (!completionStatus) {
        // Create completion status element
        completionStatus = document.createElement('div');
        completionStatus.id = 'completion-status';
        completionStatus.style.cssText = `
            background-color: #ebf8ff;
            border: 1px solid #4299e1;
            border-radius: 8px;
            padding: 12px 20px;
            margin: 0 15px 15px 15px;
            text-align: center;
            color: #2b6cb0;
            font-weight: 500;
            font-size: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 2px 4px rgba(66, 153, 225, 0.2);
            animation: fadeIn 0.5s ease;
        `;
        
        // Add completion message
        const completionMessage = document.createElement('div');
        completionMessage.style.cssText = `
            font-size: 18px;
            font-weight: 600;
            color: #2c5282;
            margin-bottom: 5px;
        `;
        completionMessage.textContent = '测试完成！';
        completionStatus.appendChild(completionMessage);
        
        // Add score information
        const scoreInfo = document.createElement('div');
        scoreInfo.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        `;
        
        const totalQuestions = document.createElement('span');
        totalQuestions.textContent = `总题数: ${window.questions.length}`;
        
        const correctAnswers = document.createElement('span');
        correctAnswers.textContent = `正确: ${correctCount}`;
        
        const scorePercent = document.createElement('span');
        scorePercent.textContent = `正确率: ${scorePercentage.toFixed(1)}%`;
        
        scoreInfo.appendChild(totalQuestions);
        scoreInfo.appendChild(correctAnswers);
        scoreInfo.appendChild(scorePercent);
        completionStatus.appendChild(scoreInfo);
        
        // Add evaluation button
        const evaluateButton = document.createElement('button');
        evaluateButton.textContent = '成绩评估';
        evaluateButton.style.cssText = `
            margin-top: 10px;
            padding: 8px 16px;
            background-color: #4299e1;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        `;
        evaluateButton.addEventListener('click', handleEvaluateClick);
        completionStatus.appendChild(evaluateButton);
        
        // Insert completion status between navigation buttons
        const prevButton = document.getElementById('prev-question-button');
        if (prevButton && prevButton.parentNode === navigationControls) {
            navigationControls.insertBefore(completionStatus, prevButton.nextSibling);
        } else {
            navigationControls.appendChild(completionStatus);
        }
        
        // Add fadeIn animation
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(styleElement);
    }
}

// Function to handle evaluation button click
function handleEvaluateClick() {
    // Create a summary of the test results
    let correctCount = 0;
    const questionResults = [];
    
    window.userAnswers.forEach((answer, index) => {
        const question = window.questions[index];
        const isCorrect = answer === question.answer;
        if (isCorrect) correctCount++;
        
        // Extract question text without "题目：" prefix
        let questionText = question.questionText;
        if (questionText.startsWith('题目：')) {
            questionText = questionText.substring(3);
        }
        
        questionResults.push({
            questionNumber: index + 1,
            questionText: questionText.substring(0, 50) + (questionText.length > 50 ? '...' : ''),
            userAnswer: answer,
            correctAnswer: question.answer,
            isCorrect: isCorrect
        });
    });
    
    const scorePercentage = (correctCount / window.questions.length) * 100;
    
    // Create prompt for API
    const prompt = `
我刚完成了一个测试，请根据我的表现给出评估和建议。

测试信息：
- 总题数: ${window.questions.length}
- 正确数: ${correctCount}
- 正确率: ${scorePercentage.toFixed(1)}%

题目详情：
${questionResults.map(result => 
    `${result.questionNumber}. ${result.questionText} - ${result.isCorrect ? '正确' : '错误'} (我的答案: ${result.userAnswer}, 正确答案: ${result.correctAnswer})`
).join('\n')}

请提供以下内容：
1. 对我的表现的总体评价
2. 我的优势和不足
3. 针对性的学习建议
4. 如何提高我的弱项
5. 下一步学习计划建议

请用鼓励的语气，并给出具体、实用的建议。
`;

    // Show loading state in the modal
    showEvaluationModal('加载中...');
    
    // Call API to get evaluation
    fetchAIResponse(prompt)
        .then(response => {
            const content = extractContentFromResponse(response);
            showEvaluationModal(content);
        })
        .catch(error => {
            console.error('Error fetching evaluation:', error);
            showEvaluationModal('获取评估时出错，请重试。');
        });
}

// Function to show evaluation modal
function showEvaluationModal(content) {
    // Create or get modal container
    let modalContainer = document.getElementById('evaluation-modal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'evaluation-modal';
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        document.body.appendChild(modalContainer);
    }
    
    // Create modal content
    let modalContent = '';
    
    if (content === '加载中...') {
        // Show loading spinner
        modalContent = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 800px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                text-align: center;
            ">
                <h2 style="
                    font-size: 24px;
                    color: #2d3748;
                    margin-bottom: 20px;
                ">正在生成评估结果</h2>
                
                <div class="spinner" style="
                    width: 50px;
                    height: 50px;
                    border: 5px solid #e2e8f0;
                    border-top: 5px solid #4299e1;
                    border-radius: 50%;
                    margin: 20px auto;
                    animation: spin 1s linear infinite;
                "></div>
                
                <p style="
                    font-size: 16px;
                    color: #4a5568;
                ">请稍候，我们正在分析您的测试结果...</p>
                
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;
    } else {
        // Process the content to identify different sections
        const sections = processEvaluationContent(content);
        
        modalContent = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 800px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            ">
                <button id="close-modal" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #4a5568;
                    padding: 5px;
                    z-index: 1;
                ">×</button>
                
                <div style="
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e2e8f0;
                ">
                    <h2 style="
                        font-size: 24px;
                        color: #2d3748;
                        margin-bottom: 5px;
                    ">成绩评估结果</h2>
                    <div style="
                        font-size: 14px;
                        color: #718096;
                    ">基于您的测试表现提供的个性化评估和建议</div>
                </div>
                
                <div class="evaluation-cards" style="
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                ">
                    ${sections.map(section => `
                        <div class="evaluation-card" style="
                            background: ${section.color};
                            border-radius: 10px;
                            padding: 20px;
                            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
                            border-left: 5px solid ${section.borderColor};
                        ">
                            <div class="card-header" style="
                                display: flex;
                                align-items: center;
                                margin-bottom: 15px;
                            ">
                                <div class="card-icon" style="
                                    width: 32px;
                                    height: 32px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    margin-right: 12px;
                                    color: ${section.iconColor};
                                ">${section.icon}</div>
                                <h3 style="
                                    font-size: 18px;
                                    color: #2d3748;
                                    margin: 0;
                                    font-weight: 600;
                                ">${section.title}</h3>
                            </div>
                            <div class="card-content" style="
                                font-size: 16px;
                                color: #4a5568;
                                line-height: 1.6;
                            ">
                                ${section.content}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="
                    text-align: center;
                    margin-top: 25px;
                ">
                    <button id="print-evaluation" style="
                        padding: 10px 20px;
                        background-color: #4299e1;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        margin-right: 10px;
                    ">打印评估结果</button>
                    <button id="close-evaluation" style="
                        padding: 10px 20px;
                        background-color: #e2e8f0;
                        color: #4a5568;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                    ">关闭</button>
                </div>
            </div>
        `;
    }
    
    modalContainer.innerHTML = modalContent;
    
    // Add event listeners
    const closeButton = document.getElementById('close-modal');
    const closeEvaluation = document.getElementById('close-evaluation');
    const printEvaluation = document.getElementById('print-evaluation');
    
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modalContainer.remove();
        });
    }
    
    if (closeEvaluation) {
        closeEvaluation.addEventListener('click', () => {
            modalContainer.remove();
        });
    }
    
    if (printEvaluation) {
        printEvaluation.addEventListener('click', () => {
            // Create a printable version
            const printContent = document.querySelector('.evaluation-cards').innerHTML;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>成绩评估结果</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        h1 {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .evaluation-card {
                            margin-bottom: 20px;
                            padding: 15px;
                            border-radius: 8px;
                            border-left: 5px solid #4299e1;
                        }
                        .card-header {
                            display: flex;
                            align-items: center;
                            margin-bottom: 10px;
                        }
                        .card-icon {
                            margin-right: 10px;
                        }
                        h3 {
                            margin: 0;
                            font-size: 18px;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                            .evaluation-card {
                                break-inside: avoid;
                                page-break-inside: avoid;
                            }
                        }
                    </style>
                </head>
                <body>
                    <h1>成绩评估结果</h1>
                    <div class="evaluation-cards">${printContent}</div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        });
    }
    
    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            modalContainer.remove();
        }
    });
}

// Function to process evaluation content into sections
function processEvaluationContent(content) {
    // Define section patterns to look for
    const sectionPatterns = [
        {
            keywords: ['总体评价', '总评', '整体表现', 'overall', '总结'],
            title: '总体评价',
            color: '#f0f9ff',
            borderColor: '#3b82f6',
            iconColor: '#3b82f6',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>'
        },
        {
            keywords: ['优势', '强项', '做得好', 'strengths', '正确'],
            title: '优势与亮点',
            color: '#f0fff4',
            borderColor: '#38a169',
            iconColor: '#38a169',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>'
        },
        {
            keywords: ['不足', '弱项', '问题', 'weaknesses', '错误', '需要改进'],
            title: '需要改进的地方',
            color: '#fff5f5',
            borderColor: '#e53e3e',
            iconColor: '#e53e3e',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
        },
        {
            keywords: ['建议', '提高', '改进', '提升', 'suggestions', '学习方法'],
            title: '学习建议',
            color: '#ebf8ff',
            borderColor: '#4299e1',
            iconColor: '#4299e1',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>'
        },
        {
            keywords: ['下一步', '计划', '未来', '接下来', 'next steps', '后续'],
            title: '下一步计划',
            color: '#faf5ff',
            borderColor: '#805ad5',
            iconColor: '#805ad5',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>'
        }
    ];
    
    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    // Initialize sections with default "Other" section
    const sections = [];
    let currentSection = null;
    
    // Process each paragraph
    paragraphs.forEach(paragraph => {
        // Check if paragraph starts a new section
        let foundSection = false;
        
        for (const pattern of sectionPatterns) {
            // Check if paragraph contains any of the section keywords
            if (pattern.keywords.some(keyword => 
                paragraph.toLowerCase().includes(keyword.toLowerCase()) &&
                (paragraph.length < 100 || paragraph.indexOf(keyword) < 50)
            )) {
                // If we already have content in the current section, add it to sections
                if (currentSection && currentSection.content) {
                    sections.push(currentSection);
                }
                
                // Start a new section
                currentSection = {
                    title: pattern.title,
                    color: pattern.color,
                    borderColor: pattern.borderColor,
                    iconColor: pattern.iconColor,
                    icon: pattern.icon,
                    content: formatParagraph(paragraph)
                };
                
                foundSection = true;
                break;
            }
        }
        
        // If not a new section, add to current section
        if (!foundSection && currentSection) {
            currentSection.content += formatParagraph(paragraph);
        } else if (!foundSection && !currentSection) {
            // If no current section, create a general section
            currentSection = {
                title: '评估结果',
                color: '#f7fafc',
                borderColor: '#718096',
                iconColor: '#718096',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
                content: formatParagraph(paragraph)
            };
        }
    });
    
    // Add the last section if it exists
    if (currentSection && currentSection.content) {
        sections.push(currentSection);
    }
    
    // If no sections were created, create a default one with all content
    if (sections.length === 0) {
        sections.push({
            title: '评估结果',
            color: '#f7fafc',
            borderColor: '#718096',
            iconColor: '#718096',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            content: formatParagraph(content)
        });
    }
    
    return sections;
}

// Helper function to format paragraphs with proper styling
function formatParagraph(paragraph) {
    // Format headings
    let formatted = paragraph
        .replace(/# (.*?)(\n|$)/g, '<h3 style="color:#2c5282;margin-top:15px;margin-bottom:10px;font-size:18px;">$1</h3>')
        .replace(/## (.*?)(\n|$)/g, '<h4 style="color:#2b6cb0;margin-top:12px;margin-bottom:8px;font-size:16px;">$1</h4>')
        .replace(/### (.*?)(\n|$)/g, '<h5 style="color:#3182ce;margin-top:10px;margin-bottom:6px;font-size:15px;">$1</h5>');
    
    // Format lists
    formatted = formatted
        .replace(/\n(\d+\. .*?)(?=\n\d+\. |\n\n|$)/g, '<li style="margin-bottom:8px;">$1</li>')
        .replace(/\n- (.*?)(?=\n- |\n\n|$)/g, '<li style="margin-bottom:8px;">$1</li>');
    
    // Wrap lists in ul tags
    formatted = formatted
        .replace(/(<li.*?<\/li>)+/g, '<ul style="padding-left:20px;margin:10px 0;">$&</ul>');
    
    // Format bold and italic
    formatted = formatted
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace newlines with <br> tags
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Add color highlighting for important terms
    formatted = formatted
        .replace(/(优势|strengths|强项)/gi, '<span style="color:#38a169;font-weight:500;">$1</span>')
        .replace(/(不足|weaknesses|弱项|问题)/gi, '<span style="color:#e53e3e;font-weight:500;">$1</span>')
        .replace(/(建议|suggestions|提高|改进|提升)/gi, '<span style="color:#3182ce;font-weight:500;">$1</span>')
        .replace(/(总体评价|overall|表现)/gi, '<span style="color:#6b46c1;font-weight:500;">$1</span>');
    
    return formatted;
}

// Function to handle generating questions
function handleGenerateQuestionsClick() {
    console.log('Generate questions button clicked');
    
    // Try multiple methods to find the dropdown elements
    function findDropdown(id) {
        // Method 1: Direct ID
        let element = document.getElementById(id);
        
        // Method 2: Try with sidebar- prefix if not found
        if (!element && !id.startsWith('sidebar-')) {
            element = document.getElementById('sidebar-' + id);
        }
        
        // Method 3: Try querySelector with attribute selector
        if (!element) {
            element = document.querySelector(`select[id="${id}"], select[id="sidebar-${id}"]`);
        }
        
        // Method 4: Try any select with id containing the base name
        if (!element) {
            const allSelects = document.querySelectorAll('select');
            for (const select of allSelects) {
                if (select.id && select.id.includes(id.replace('sidebar-', ''))) {
                    element = select;
                    break;
                }
            }
        }
        
        // Log what we found
        console.log(`Finding dropdown ${id}: ${element ? 'Found with value: ' + element.value : 'Not found'}`);
        
        return element;
    }
    
    // Get form elements from sidebar using the helper function
    const schoolDropdown = findDropdown('sidebar-school');
    const gradeDropdown = findDropdown('sidebar-grade');
    const semesterDropdown = findDropdown('sidebar-semester');
    const subjectDropdown = findDropdown('sidebar-subject');
    const difficultyDropdown = findDropdown('sidebar-difficulty');
    const countDropdown = findDropdown('sidebar-count');
    
    // Log all dropdowns in the document for debugging
    console.log('All select elements in document:');
    const allSelects = document.querySelectorAll('select');
    allSelects.forEach(select => {
        console.log(`- ${select.id || 'no-id'}: ${select.value || 'no-value'}`);
    });
    
    console.log('Dropdown values:', {
        school: schoolDropdown?.value,
        grade: gradeDropdown?.value,
        semester: semesterDropdown?.value,
        subject: subjectDropdown?.value,
        difficulty: difficultyDropdown?.value,
        count: countDropdown?.value
    });
    
    // First check if school and grade are selected
    if (!schoolDropdown || !schoolDropdown.value) {
        showSystemMessage('请选择学校类型', 'warning');
        
        // Highlight the empty dropdown
        if (schoolDropdown) {
            // Add a red border to highlight the empty dropdown
            schoolDropdown.style.border = '2px solid #e53e3e';
            
            // Remove the highlight after 3 seconds
            setTimeout(() => {
                schoolDropdown.style.border = '';
            }, 3000);
            
            // Focus on the empty dropdown
            schoolDropdown.focus();
        }
        
        return; // Stop execution if school is not selected
    }
    
    if (!gradeDropdown || !gradeDropdown.value) {
        showSystemMessage('请选择年级', 'warning');
        
        // Highlight the empty dropdown
        if (gradeDropdown) {
            // Add a red border to highlight the empty dropdown
            gradeDropdown.style.border = '2px solid #e53e3e';
            
            // Remove the highlight after 3 seconds
            setTimeout(() => {
                gradeDropdown.style.border = '';
            }, 3000);
            
            // Focus on the empty dropdown
            gradeDropdown.focus();
        }
        
        return; // Stop execution if grade is not selected
    }
    
    // Check if any of the other dropdowns are not selected
    const otherDropdowns = [
        { element: semesterDropdown, name: '学期' },
        { element: subjectDropdown, name: '科目' },
        { element: difficultyDropdown, name: '难度' },
        { element: countDropdown, name: '题目数量' }
    ];
    
    // Filter to find empty dropdowns, ensuring we check both existence and value
    const emptyDropdowns = otherDropdowns.filter(dropdown => 
        !dropdown.element || 
        dropdown.element.value === undefined || 
        dropdown.element.value === null || 
        dropdown.element.value === ''
    );
    
    console.log('Empty dropdowns:', emptyDropdowns.map(d => d.name));
    
    if (emptyDropdowns.length > 0) {
        // Show a combined warning message
        showSystemMessage('请选择科目，学期，难度和题数！', 'warning');
        
        // Highlight all empty dropdowns
        emptyDropdowns.forEach(dropdown => {
            if (dropdown.element) {
                // Add a red border to highlight the empty dropdown
                dropdown.element.style.border = '2px solid #e53e3e';
                
                // Remove the highlight after 3 seconds
                setTimeout(() => {
                    dropdown.element.style.border = '';
                }, 3000);
            }
        });
        
        // Focus on the first empty dropdown
        if (emptyDropdowns[0].element) {
            emptyDropdowns[0].element.focus();
        }
        
        return; // Stop execution if any dropdown is empty
    }
    
    // If we get here, all dropdowns are filled
    console.log('All dropdowns are filled, proceeding with question generation');
    
    // Get the create container and questions display container
    const createContainer = document.getElementById('create-container');
    let questionsDisplayContainer = document.querySelector('.questions-display-container');
    
    // Create the questions display container if it doesn't exist
    if (!questionsDisplayContainer && createContainer) {
        questionsDisplayContainer = document.createElement('div');
        questionsDisplayContainer.className = 'questions-display-container';
        createContainer.appendChild(questionsDisplayContainer);
    }
    
    // Show loading indicator
    showLoadingIndicator();
    
    // Hide empty state if it exists
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.classList.add('hidden');
    }
    
    // Get form data - use trim to handle whitespace
    const school = schoolDropdown ? schoolDropdown.value.trim() : '';
    const grade = gradeDropdown ? gradeDropdown.value.trim() : '';
    const semester = semesterDropdown ? semesterDropdown.value.trim() : '';
    const subject = subjectDropdown ? subjectDropdown.value.trim() : '';
    const difficulty = difficultyDropdown ? difficultyDropdown.value.trim() : '';
    const count = countDropdown ? countDropdown.value.trim() : '5';
    
    console.log(`Generating questions for ${school} ${grade} ${semester} ${subject}, difficulty: ${difficulty}, count: ${count}`);
    
    // Prepare the prompt
    const prompt = `请为${school}${grade}${semester}${subject}生成${count}道${difficulty}难度的选择题，每道题有4个选项(A,B,C,D)，并且只有一个正确答案。

题目格式要求：
1. 每道题必须包含题目、4个选项、答案和详细解析
2. 题目必须按顺序编号
3. 选项必须使用A、B、C、D标记
4. 每道题的答案必须是A、B、C、D中的一个
5. 每道题必须有详细解析
6. "答案："后接正确选项（必须是A、B、C、D其中之一）
7. "解析："后必须包含完整的解析（至少50字）

解析部分必须包含以下内容（缺一不可）：
1. 解题思路和方法，不能超纲
2. 关键知识点解释
3. 正确答案的推导过程
4. 为什么其他选项是错误的
5. 相关知识点的总结
6. 易错点提醒

示例格式：
题目：[题目内容]
A. [选项A内容] 
B. [选项B内容]
C. [选项C内容]
D. [选项D内容]
答案：[A或B或C或D]
解析：本题主要考察[知识点]。解题思路是[详细说明]。首先，[推导过程]。选项分析：A选项[分析]，B选项[分析]，C选项[分析]，D选项[分析]。需要注意的是[易错点]。总的来说，[知识点总结]。同学们在解题时要特别注意[关键提醒]。

题目质量要求：
1. 题目表述必须清晰、准确，无歧义
2. 选项内容必须完整，符合逻辑
3. 所有选项必须有实际意义，不能有无意义的干扰项
4. 难度必须符合年级水平
5. 解析必须详尽，有教育意义
6. 不出带图形的题目
`;
    
    // Call API to generate questions
    fetchAIResponse(prompt)
        .then(response => {
            try {
                console.log('Processing API response:', response);
                
                // Hide loading indicator
                hideLoadingIndicator();
                
                // Parse the response
                const parsedQuestions = parseQuestionsFromResponse(response);
                
                if (parsedQuestions.length > 0) {
                    // Store the questions globally
                    window.questions = parsedQuestions;
                    window.currentQuestionIndex = 0;
                    
                    // Display the first question
                    displayCurrentQuestion();
                    
                    // Set up navigation buttons
                    setupNavigationButtons();
                    
                    // Hide empty state if it exists
                    if (emptyState) {
                        emptyState.classList.add('hidden');
                    }
                    
                    // Show success message
                    showSystemMessage(`成功生成了 ${parsedQuestions.length} 道题目`, 'success');
                } else {
                    // Show error message
                    showSystemMessage('无法解析生成的题目，请重试', 'error');
                    
                    // Show empty state
                    initializeEmptyState();
                }
            } catch (error) {
                console.error('Error processing questions:', error);
                
                // Hide loading indicator
                hideLoadingIndicator();
                
                // Show error message
                showSystemMessage('处理题目时出错，请重试', 'error');
                
                // Show empty state
                initializeEmptyState();
            }
        })
        .catch(error => {
            console.error('Error generating questions:', error);
            
            // Hide loading indicator
            hideLoadingIndicator();
            
            // Show error message
            showSystemMessage('生成题目时出错，请重试', 'error');
            
            // Show empty state
            initializeEmptyState();
        });
}

// Function to show loading indicator with spinning icon
function showLoadingIndicator() {
    // Get the questions display container
    const questionsDisplayContainer = document.getElementById('questions-display-container');
    if (!questionsDisplayContainer) {
        console.error('Questions display container not found in showLoadingIndicator');
        return;
    }
    
    // Hide empty state if it exists
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
        emptyState.classList.add('hidden');
    }
    
    // Create loading indicator if it doesn't exist
    let loadingIndicator = document.getElementById('test-loading-indicator');
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'test-loading-indicator';
        loadingIndicator.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            margin: 20px auto;
            width: 80%;
            max-width: 500px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 100;
        `;
        
        // Create spinning icon
        const spinnerIcon = document.createElement('div');
        spinnerIcon.className = 'spinner-icon';
        spinnerIcon.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #4299e1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        `;
        
        // Create loading text
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Thinking...';
        loadingText.style.cssText = `
            font-size: 18px;
            color: #4a5568;
            font-weight: 500;
        `;
        
        // Add spinner animation
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleElement);
        
        // Assemble loading indicator
        loadingIndicator.appendChild(spinnerIcon);
        loadingIndicator.appendChild(loadingText);
        
        // Add to container without clearing its contents
        questionsDisplayContainer.style.position = 'relative';
        questionsDisplayContainer.appendChild(loadingIndicator);
        questionsDisplayContainer.classList.remove('hidden');
    } else {
        loadingIndicator.style.display = 'flex';
    }
}

// Function to hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('test-loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Function to set up navigation button event listeners
function setupNavigationButtons() {
    console.log('Setting up navigation buttons');
    
    const prevButton = document.getElementById('prev-question-button');
    const nextButton = document.getElementById('next-question-button');
    
    // Create navigation controls if they don't exist
    let navigationControls = document.querySelector('.navigation-controls');
    if (!navigationControls) {
        navigationControls = document.createElement('div');
        navigationControls.className = 'navigation-controls';
        navigationControls.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 20px 0;
            width: 100%;
            flex-wrap: wrap;
            gap: 10px;
        `;
        
        const questionsDisplayContainer = document.getElementById('questions-display-container');
        if (questionsDisplayContainer) {
            questionsDisplayContainer.appendChild(navigationControls);
        }
    }
    
    // Create prev button if it doesn't exist
    if (!prevButton) {
        const newPrevButton = document.createElement('button');
        newPrevButton.id = 'prev-question-button';
        newPrevButton.className = 'nav-button';
        newPrevButton.innerHTML = '&larr; 上一题';
        newPrevButton.style.cssText = `
            padding: clamp(8px, 3vw, 12px) clamp(15px, 4vw, 25px);
            font-size: clamp(14px, 3.5vw, 16px);
            border-radius: 8px;
            margin: clamp(5px, 2vw, 10px);
            background-color: #edf2f7;
            color: #4a5568;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        newPrevButton.addEventListener('click', function() {
            if (window.currentQuestionIndex > 0) {
                window.currentQuestionIndex--;
                displayCurrentQuestion();
                updateNavigationButtons();
            }
        });
        
        navigationControls.appendChild(newPrevButton);
    } else {
        // Remove any existing event listeners
        const newPrevButton = prevButton.cloneNode(true);
        prevButton.parentNode.replaceChild(newPrevButton, prevButton);
        
        // Add new event listener
        newPrevButton.addEventListener('click', function() {
            if (window.currentQuestionIndex > 0) {
                window.currentQuestionIndex--;
                displayCurrentQuestion();
                updateNavigationButtons();
            }
        });
    }
    
    // Create next button if it doesn't exist
    if (!nextButton) {
        const newNextButton = document.createElement('button');
        newNextButton.id = 'next-question-button';
        newNextButton.className = 'nav-button';
        newNextButton.innerHTML = '下一题 &rarr;';
        newNextButton.style.cssText = `
            padding: clamp(8px, 3vw, 12px) clamp(15px, 4vw, 25px);
            font-size: clamp(14px, 3.5vw, 16px);
            border-radius: 8px;
            margin: clamp(5px, 2vw, 10px);
            background-color: #4299e1;
            color: white;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        newNextButton.addEventListener('click', function() {
            if (window.questions && window.currentQuestionIndex < window.questions.length - 1) {
                window.currentQuestionIndex++;
                displayCurrentQuestion();
                updateNavigationButtons();
            }
        });
        
        navigationControls.appendChild(newNextButton);
    } else {
        // Remove any existing event listeners
        const newNextButton = nextButton.cloneNode(true);
        nextButton.parentNode.replaceChild(newNextButton, nextButton);
        
        // Add new event listener
        newNextButton.addEventListener('click', function() {
            if (window.questions && window.currentQuestionIndex < window.questions.length - 1) {
                window.currentQuestionIndex++;
                displayCurrentQuestion();
                updateNavigationButtons();
            }
        });
    }
    
    // Update button states
    updateNavigationButtons();
}

// Function to set up option selection buttons
function setupOptionButtons() {
    console.log('Setting up option buttons');
    
    // Set up optimize button
    const optimizeButton = document.getElementById('optimize-button');
    if (optimizeButton) {
        optimizeButton.addEventListener('click', function() {
            const currentQuestion = questions[currentQuestionIndex];
            if (!currentQuestion) return;
            
            // Get educational context from sidebar dropdowns
            const schoolDropdown = document.getElementById('sidebar-school');
            const gradeDropdown = document.getElementById('sidebar-grade');
            const subjectDropdown = document.getElementById('sidebar-subject');
            
            const school = schoolDropdown ? schoolDropdown.value : '';
            const grade = gradeDropdown ? gradeDropdown.value : '';
            const subject = subjectDropdown ? subjectDropdown.value : '';
            
            // Show loading state
            optimizeButton.disabled = true;
            optimizeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 优化中...';
            
            // Prepare the prompt for optimization with educational context
            let prompt = `请优化以下${school}${grade}${subject}的题目，使其更清晰、更有教育价值，并确保答案和解析准确：
            
问题：${currentQuestion.question}
选项：
A. ${currentQuestion.choices[0]}
B. ${currentQuestion.choices[1]}
C. ${currentQuestion.choices[2]}
D. ${currentQuestion.choices[3]}
答案：${currentQuestion.answer}
解析：${currentQuestion.explanation}`;

            // Add specific educational guidance based on school level
            if (school === '小学') {
                prompt += `\n\n请特别注意：
1. 使用简单、直观的语言，适合${grade}学生的理解水平
2. 确保题目内容符合${grade}${subject}教学大纲
3. 解析应该循序渐进，使用具体例子帮助理解
4. 避免使用过于抽象的概念
5. 增加趣味性和生活化的元素`;
            } else if (school === '初中') {
                prompt += `\n\n请特别注意：
1. 使用清晰但稍有挑战性的语言，适合${grade}学生
2. 确保题目内容符合${grade}${subject}教学大纲
3. 解析应该既有基础知识点讲解，也有思维方法指导
4. 可以适当引入抽象概念，但需要配合具体例子
5. 增加与实际应用相关的内容`;
            } else if (school === '高中') {
                prompt += `\n\n请特别注意：
1. 使用准确、规范的学科语言，适合${grade}学生
2. 确保题目内容符合${grade}${subject}教学大纲和考试要求
3. 解析应该深入分析解题思路和方法，强调知识点间的联系
4. 可以使用较为抽象的概念和复杂的推理
5. 增加与升学考试相关的解题技巧和方法`;
            }

            prompt += `\n\n请返回优化后的问题、选项、答案和解析，格式如下：
问题：[优化后的问题]
选项：
A. [选项A]
B. [选项B]
C. [选项C]
D. [选项D]
答案：[答案]
解析：[解析]`;
            
            // Call the API
            fetchAIResponse(prompt)
                .then(response => {
                    // Extract the optimized question
                    const optimizedContent = extractContentFromResponse(response);
                    
                    // Parse the optimized question
                    const optimizedQuestion = parseOptimizedQuestion(optimizedContent);
                    
                    if (optimizedQuestion) {
                        // Update the current question with optimized content
                        questions[currentQuestionIndex] = {
                            ...questions[currentQuestionIndex],
                            ...optimizedQuestion
                        };
                        
                        // Display the updated question
                        displayCurrentQuestion();
                        
                        // Show success message with educational context
                        showSystemMessage(`问题已根据${school}${grade}${subject}教学要求成功优化！`, 'success');
                    } else {
                        showSystemMessage('无法解析优化后的问题，请重试。', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error optimizing question:', error);
                    showSystemMessage('优化问题时出错，请重试。', 'error');
                })
                .finally(() => {
                    // Reset button state
                    optimizeButton.disabled = false;
                    optimizeButton.innerHTML = '<i class="fas fa-magic"></i> 优化问题';
                });
        });
    }
    
    // Set up submit button
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const selectedChoice = document.querySelector('.choice-cell.selected');
            if (selectedChoice) {
                const selectedValue = selectedChoice.getAttribute('data-value');
                displayAnswer(selectedValue);
                
                // Disable the submit button after submission
                submitButton.disabled = true;
                submitButton.classList.add('disabled');
            } else {
                showSystemMessage('请先选择一个答案', 'warning');
            }
        });
    }
}

// Make sure the function is available globally for the inline onclick handler
window.handleGenerateQuestionsClick = handleGenerateQuestionsClick;
window.fetchAIResponse = fetchAIResponse;
window.parseQuestionsFromResponse = parseQuestionsFromResponse;
window.showSystemMessage = showSystemMessage;
window.extractContentFromResponse = extractContentFromResponse;

// Function to show system messages
function showSystemMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `system-message ${type}`;
    messageElement.textContent = message;
    
    // Get the questions display container
    const questionsDisplayContainer = document.getElementById('questions-display-container');
    
    // Create status container if it doesn't exist
    let statusContainer = document.getElementById('status-container');
    if (!statusContainer) {
        statusContainer = document.createElement('div');
        statusContainer.id = 'status-container';
        statusContainer.className = 'status-container';
        questionsDisplayContainer.insertBefore(statusContainer, questionsDisplayContainer.firstChild);
    }
    
    // Clear previous messages
    statusContainer.innerHTML = '';
    
    // Add new message
    statusContainer.appendChild(messageElement);
    
    // Auto-remove after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }
}

// Initialize the page with form layout
function initializeFormLayout() {
    const formContainer = document.getElementById('question-form-container');
    if (!formContainer) return;
    
    // Style the form container with a more compact look
    formContainer.style.cssText = `
        padding: 15px;
        margin-bottom: 10px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        min-height: auto;
        height: auto;
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
    `;
    
    // Create a flex container for the dropdowns with reduced spacing
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'dropdown-container';
    dropdownContainer.style.cssText = `
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 15px;
        flex-wrap: nowrap;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 8px;
    `;
    
    // Move all select elements into the dropdown container
    const selects = formContainer.querySelectorAll('select');
    selects.forEach(select => {
        const wrapper = document.createElement('div');
        wrapper.className = 'select-wrapper';
        wrapper.style.cssText = `
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            margin: 0;
            position: relative;
        `;
        
        // Get the label for this select
        const label = formContainer.querySelector(`label[for="${select.id}"]`);
        if (label) {
            label.style.cssText = `
                margin-bottom: 4px;
                font-size: 13px;
                font-weight: 500;
                color: #4a5568;
                white-space: nowrap;
            `;
            wrapper.appendChild(label);
        }
        
        // Style the select element
        select.style.cssText = `
            width: 100%;
            padding: 6px 10px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 13px;
            color: #2d3748;
            background-color: white;
            transition: all 0.2s ease;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%234a5568' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 8px center;
            background-size: 12px;
            margin: 0;
        `;
        
        wrapper.appendChild(select);
        dropdownContainer.appendChild(wrapper);
    });
    
    // Create a more compact button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: center;
        padding: 10px 0;
        margin: 5px 0 10px 0;
        border-bottom: 1px solid #edf2f7;
    `;
    
    // Style the generate questions button
    const generateButton = document.getElementById('generate-questions-button');
    if (generateButton) {
        generateButton.style.cssText = `
            padding: 10px 25px;
            font-size: 15px;
            font-weight: 500;
            background-color: #4299e1;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(66, 153, 225, 0.2);
        `;
        
        buttonContainer.appendChild(generateButton);
    }
    
    // Style the API function container with reduced spacing
    const apiRadioContainer = document.querySelector('.api-function-container');
    if (apiRadioContainer) {
        apiRadioContainer.style.cssText = `
            padding: 12px;
            margin-top: 5px;
            background-color: #f8f9fa;
            border-top: 1px solid #edf2f7;
            border-radius: 0 0 12px 12px;
            display: flex;
            justify-content: center;
            gap: 15px;
        `;
        
        // Style radio buttons and labels
        const radioButtons = apiRadioContainer.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            const label = radio.nextElementSibling;
            if (label) {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                
                radio.style.cssText = `
                    width: 14px;
                    height: 14px;
                    cursor: pointer;
                    accent-color: #4299e1;
                    margin: 0;
                `;
                
                label.style.cssText = `
                    font-size: 13px;
                    color: #4a5568;
                    cursor: pointer;
                    margin: 0;
                `;
                
                // Move radio and label to the wrapper
                radio.parentNode.insertBefore(wrapper, radio);
                wrapper.appendChild(radio);
                wrapper.appendChild(label);
            }
        });
    }
    
    // Insert elements in the correct order with minimal spacing
    const form = document.getElementById('question-form');
    if (form) {
        form.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 0;
            margin: 0;
        `;
        
        // Remove any existing containers
        const existingDropdownContainer = form.querySelector('.dropdown-container');
        if (existingDropdownContainer) {
            existingDropdownContainer.remove();
        }
        
        // Remove the header if it exists
        const header = form.querySelector('h3');
        if (header && header.textContent.includes('设置问题参数')) {
            header.remove();
        }
        
        // Insert containers in the correct order
        form.insertBefore(dropdownContainer, form.firstChild);
        formContainer.parentNode.insertBefore(buttonContainer, formContainer.nextSibling);
    }
    
    // Set up event listeners for the sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const leftPanel = document.querySelector('.left-panel');
    const contentArea = document.querySelector('.content-area');
    
        leftPanel.classList.toggle('hidden');
        contentArea.classList.toggle('full-width');
        sidebarToggle.classList.toggle('collapsed');
        
            // Change the icon direction
            const icon = sidebarToggle.querySelector('i');
            if (icon) {
                if (leftPanel.classList.contains('hidden')) {
                    icon.className = 'fas fa-chevron-right';
                } else {
                    icon.className = 'fas fa-chevron-left';
                }
            }
        });
    }
    
    // Set up event listeners for tab buttons
    const qaButton = document.getElementById('qa-button');
    const createButton = document.getElementById('create-button');
    const qaContainer = document.getElementById('qa-container');
    const createContainer = document.getElementById('create-container');
    
    if (qaButton && createButton && qaContainer && createContainer) {
        qaButton.addEventListener('click', function() {
        qaButton.classList.add('active');
        createButton.classList.remove('active');
            qaContainer.style.display = 'block';
            createContainer.style.display = 'none';
        });
        
        createButton.addEventListener('click', function() {
        createButton.classList.add('active');
        qaButton.classList.remove('active');
            createContainer.style.display = 'block';
            qaContainer.style.display = 'none';
        });
    }
    
    // Set up event listeners for the sidebar generate button
    const sidebarGenerateButton = document.getElementById('sidebar-generate-button');
    if (sidebarGenerateButton) {
        sidebarGenerateButton.addEventListener('click', function() {
            // If not already on the test tab, switch to it
            if (createButton && !createButton.classList.contains('active')) {
                createButton.click();
            }
            
            // Call the generate questions function
            handleGenerateQuestionsClick();
        });
    }
    
    // Add event listeners for the optimize and submit buttons
    setupOptimizeAndSubmitButtons();
}

// Function to set up optimize and submit buttons
function setupOptimizeAndSubmitButtons() {
    if (window.optimizeSubmitButtonsInitialized) {
        console.log('Optimize and submit buttons already initialized, skipping setup');
        return;
    }

    console.log('Setting up optimize and submit buttons');

    // Use unique variable names to avoid conflicts
    const optimizeQuestionBtn = document.querySelector('.optimize-question-btn');
    const submitQuestionBtn = document.querySelector('.submit-question-btn');

    if (!optimizeQuestionBtn || !submitQuestionBtn) {
        console.error('Could not find optimize or submit buttons');
        return;
    }

    // Clone and replace optimize button
    const newOptimizeBtn = optimizeQuestionBtn.cloneNode(true);
    optimizeQuestionBtn.parentNode.replaceChild(newOptimizeBtn, optimizeQuestionBtn);

    // Clone and replace submit button
    const newSubmitBtn = submitQuestionBtn.cloneNode(true);
    submitQuestionBtn.parentNode.replaceChild(newSubmitBtn, submitQuestionBtn);

    // Add event listeners to new buttons
    newOptimizeBtn.addEventListener('click', async () => {
        const chatInput = document.querySelector('.chat-input');
        if (!chatInput || !chatInput.value.trim()) {
            alert('请输入问题内容');
            return;
        }

        const { school, grade } = getSidebarDropdownValues();
        if (!school || !grade) {
            highlightEmptyDropdowns();
            return;
        }

        const loadingIndicator = document.createElement('div');
        loadingIndicator.textContent = '正在优化问题...';
        loadingIndicator.className = 'loading-indicator';
        chatInput.parentNode.appendChild(loadingIndicator);

        try {
            const prompt = `请优化以下问题，使其更加清晰和专业。考虑到这是${school}${grade}年级的问题：\n\n${chatInput.value}`;
            const response = await fetchAIResponse(prompt);
            chatInput.value = response;
        } catch (error) {
            console.error('Error optimizing question:', error);
            alert('优化问题时出错，请稍后重试');
        } finally {
            loadingIndicator.remove();
        }
    });

    newSubmitBtn.addEventListener('click', async () => {
        const chatInput = document.querySelector('.chat-input');
        if (!chatInput || !chatInput.value.trim()) {
            alert('请输入问题内容');
            return;
        }

        const { school, grade } = getSidebarDropdownValues();
        if (!school || !grade) {
            highlightEmptyDropdowns();
            return;
        }

        const loadingIndicator = document.createElement('div');
        loadingIndicator.textContent = '正在处理...';
        loadingIndicator.className = 'loading-indicator';
        chatInput.parentNode.appendChild(loadingIndicator);

        try {
            const prompt = `作为一名${school}${grade}年级的老师，请回答以下问题：\n\n${chatInput.value}`;
            const response = await fetchAIResponse(prompt);
            appendChatMessage(chatInput.value, response);
            chatInput.value = '';
        } catch (error) {
            console.error('Error submitting question:', error);
            alert('提交问题时出错，请稍后重试');
        } finally {
            loadingIndicator.remove();
        }
    });

    window.optimizeSubmitButtonsInitialized = true;
    console.log('Optimize and submit buttons setup completed');
}

// Add the missing setupChatButtons function
function setupChatButtons() {
    if (window.chatButtonsInitialized) {
        console.log('Chat buttons already initialized, skipping setup');
        return;
    }

    console.log('Setting up chat buttons');

    // Use unique variable names for chat buttons to avoid conflicts
    const chatOptimizeBtn = document.querySelector('.chat-optimize-btn');
    const chatSubmitBtn = document.querySelector('.chat-submit-btn');

    if (!chatOptimizeBtn || !chatSubmitBtn) {
        console.error('Could not find chat optimize or submit buttons');
        return;
    }

    // Clone and replace chat optimize button
    const newChatOptimizeBtn = chatOptimizeBtn.cloneNode(true);
    chatOptimizeBtn.parentNode.replaceChild(newChatOptimizeBtn, chatOptimizeBtn);

    // Clone and replace chat submit button
    const newChatSubmitBtn = chatSubmitBtn.cloneNode(true);
    chatSubmitBtn.parentNode.replaceChild(newChatSubmitBtn, chatSubmitBtn);

    // Add event listeners to new chat buttons
    newChatOptimizeBtn.addEventListener('click', async () => {
        const chatInput = document.querySelector('.chat-input');
        if (!chatInput || !chatInput.value.trim()) {
            alert('请输入问题内容');
            return;
        }

        const { school, grade } = getSidebarDropdownValues();
        if (!school || !grade) {
            highlightEmptyDropdowns();
            return;
        }

        const loadingIndicator = document.createElement('div');
        loadingIndicator.textContent = '正在优化问题...';
        loadingIndicator.className = 'loading-indicator';
        chatInput.parentNode.appendChild(loadingIndicator);

        try {
            const prompt = `请优化以下问题，使其更加清晰和专业。考虑到这是${school}${grade}年级的问题：\n\n${chatInput.value}`;
            const response = await fetchAIResponse(prompt);
            chatInput.value = response;
        } catch (error) {
            console.error('Error optimizing question:', error);
            alert('优化问题时出错，请稍后重试');
        } finally {
            loadingIndicator.remove();
        }
    });

    newChatSubmitBtn.addEventListener('click', async () => {
        const chatInput = document.querySelector('.chat-input');
        if (!chatInput || !chatInput.value.trim()) {
            alert('请输入问题内容');
            return;
        }

        const { school, grade } = getSidebarDropdownValues();
        if (!school || !grade) {
            highlightEmptyDropdowns();
            return;
        }

        const loadingIndicator = document.createElement('div');
        loadingIndicator.textContent = '正在处理...';
        loadingIndicator.className = 'loading-indicator';
        chatInput.parentNode.appendChild(loadingIndicator);

        try {
            const prompt = `作为一名${school}${grade}年级的老师，请回答以下问题：\n\n${chatInput.value}`;
            const response = await fetchAIResponse(prompt);
            appendChatMessage(chatInput.value, response);
            chatInput.value = '';
        } catch (error) {
            console.error('Error submitting question:', error);
            alert('提交问题时出错，请稍后重试');
        } finally {
            loadingIndicator.remove();
        }
    });

    window.chatButtonsInitialized = true;
    console.log('Chat buttons setup completed');
}

// Make sure chatButtonsInitialized is defined globally
window.chatButtonsInitialized = false;

// Update the document.addEventListener at the end of the file
document.addEventListener('DOMContentLoaded', function() {
    // Only call setupChatButtons if it hasn't been initialized yet
    if (!window.chatButtonsInitialized) {
        setTimeout(() => {
            setupChatButtons();
            window.chatButtonsInitialized = true;
        }, 300);
    }
});