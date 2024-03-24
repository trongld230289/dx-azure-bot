// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require("./intentrecognizer")
const axios = require('axios');
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");

class EchoBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();

        // create a QnAMaker connector

        // create a DentistScheduler connector

        // create a IntentRecognizer connector


        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
            const question = context.activity.text;
            const userId = context.activity.channelData.clientActivityID;
            const qnaResults = await this.getAnswer(question);
            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'

            // determine which service to respond with based on the results from LUIS //

            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}

            if (qnaResults[0]) {
                await context.sendActivity(`${qnaResults[0].answer}`);
            }
            else {
                // If no answers were returned from QnA Maker, reply with help.
                await context.sendActivity(`I'm not sure I can answer your question`
                    + 'I can find charging stations or electric vehicle parking'
                    + `Or you can ask me questions about electric vehicles`);
            }

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            //write a custom greeting
            const welcomeText = '';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // by calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    analyzeConversation = async (participantId, query, queryLanguage) => {
        const response = await axios.post(
            "https://cus-ques-ans.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2022-10-01-preview",
            {
                kind: "Conversation",
                analysisInput: {
                    conversationItem: {
                        id: participantId,
                        text: query,
                        modality: "text",
                        language: queryLanguage,
                        participantId: participantId
                    }
                },
                parameters: {
                    projectName: "cus-ques-ans-luis",
                    verbose: true,
                    deploymentName: "cus-ques-ans-luis-model",
                    stringIndexType: "TextElement_V8"
                }
            },
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': '05dfac94d5f848348c3f51a6a1bece42',
                    'Apim-Request-Id': '4ffcac1c-b2fc-48ba-bd6d-b69d9942995a',
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    };

    getAnswer = async (question) => {
        const response = await axios.post(
            "https://cus-ques-ans.cognitiveservices.azure.com/language/:query-knowledgebases?projectName=cus-ques-ans&api-version=2021-10-01&deploymentName=production",
            {
                top: 3,
                question: question,
                includeUnstructuredSources: true,
                confidenceScoreThreshold: "0.6"
            },
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': '05dfac94d5f848348c3f51a6a1bece42',
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.answers;
    };

    sentimentAnalysis = async (client, userText) => {
        console.log("Running sentiment analysis on: " + userText);
        // Make userText into an array
        const sentimentInput = [userText];
        // call analyzeSentiment and get results
        const sentimentResult = await client.analyzeSentiment(sentimentInput);
        console.log("Got sentiment result");

        // This is where you send the sentimentInput and sentimentResults to a database or storage instead of the console

        sentimentResult.forEach(document => {
            console.log(`ID: ${document.id}`);
            console.log(`\tDocument Sentiment: ${document.sentiment}`);
            console.log(`\tDocument Scores:`);
            console.log(`\t\tPositive: ${document.confidenceScores.positive.toFixed(2)} \tNegative: ${document.confidenceScores.negative.toFixed(2)} \tNeutral: ${document.confidenceScores.neutral.toFixed(2)}`);
            console.log(`\tSentences Sentiment(${document.sentences.length}):`);
            document.sentences.forEach(sentence => {
                console.log(`\t\tSentence sentiment: ${sentence.sentiment}`)
                console.log(`\t\tSentences Scores:`);
                console.log(`\t\tPositive: ${sentence.confidenceScores.positive.toFixed(2)} \tNegative: ${sentence.confidenceScores.negative.toFixed(2)} \tNeutral: ${sentence.confidenceScores.neutral.toFixed(2)}`);
            });
        });
    }

}

module.exports.EchoBot = EchoBot;
