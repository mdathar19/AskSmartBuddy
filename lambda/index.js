const Alexa = require('ask-sdk-core');
const https = require('https');

// Lightweight fetch function using https module
function fetch(url, options) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const data = options.body || null;
        const req = https.request({
            method: options.method,
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            headers: options.headers
        }, (res) => {
            let chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                resolve({
                    status: res.statusCode,
                    json: () => Promise.resolve(JSON.parse(body))
                });
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(data);
        }
        req.end();
    });
}

const OPENAI_API_KEY = 'your_openai_api'; // <-- Replace this with your real OpenAI API key

const ChatGPTIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ChatGPTIntent'; 
    },
    async handle(handlerInput) {
        const query = handlerInput.requestEnvelope.request.intent.slots.query.value;
        

        if (!query) {
            return handlerInput.responseBuilder
                .speak("I didn't hear your question. Can you ask again?")
                .reprompt("Please ask a question.")
                .getResponse();
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'user', content: query }
                    ]
                })
            });

            const data = await response.json();
            

            const answer = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "I think your API key is expired";

            return handlerInput.responseBuilder
                .speak(answer)
                .reprompt("You can ask me something else.")
                .getResponse();

        } catch (error) {
            console.error('Error fetching ChatGPT response:', error);

            return handlerInput.responseBuilder
                .speak("Sorry, I had trouble connecting to ChatGPT. Please try again later.")
                .getResponse();
        }
    }
};


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to Smart Buddy! You can ask me anything?';
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Please ask your question.')
            .getResponse();
    }
};


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can ask me any question, and I will try to answer using Smart Buddy.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What would you like to ask?')
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I did not understand that. Please ask again.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Please try again.')
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse(); // Do nothing
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ChatGPTIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler
    )
    .lambda();
