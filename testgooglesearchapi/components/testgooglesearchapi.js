'use strict';

// You can use your favorite http client package to make REST calls, however, the node fetch API is pre-installed with the bots-node-sdk.
// Documentation can be found at https://www.npmjs.com/package/node-fetch
// Un-comment the next line if you want to make REST calls using node-fetch. 
// const fetch = require("node-fetch");

const SerpApi = require('google-search-results-nodejs');

module.exports = {
  metadata: () => ({
    name: 'testgooglesearchapi',
    properties: {
      variable: {required: true, type: 'string'},
      apiKey : {required: true, type: 'string'},
    },
    supportedActions: ['shortAnswerFound', 'longAnswerFound', 'shortAndLongAnswerFound', 'answerNotFound', 'failure']
  }),


  /**
   * invoke methods gets called when the custom component state is executed in the dialog flow
   * @param {CustomComponentContext} conversation
  */
  invoke: async (conversation, done) => {
    try {
      var d = new Date();
      conversation.logger().info("Invoke called in custom component: "+ d.toISOString());
      
      const { variable } = conversation.properties();
      const { apiKey } = conversation.properties()

      // Log info to console
      
      // Make the URL
      var question = conversation.text();
      var questionInUrl = encodeURIComponent(question)
      conversation.logger().info("Input Parameters: Variable: " + variable + ", Question: " + question);
      var reqUrl = "https://serpapi.com/search.json?engine=google&q=" + questionInUrl + "&google_domain=google.com&gl=us&hl=en&api_key=" + apiKey

      const axios = require('axios');

      conversation.logger().info("Calling API: "+ d.toISOString());
      conversation.logger().info("Request URL:" + reqUrl.replace(apiKey,"*********"))
      
      // Call the API
      axios.get(reqUrl, {})

      .then(function (response) {
        conversation.logger().info("Response received")
        if (response.status === 200) {
          return response.data
        } else {
          conversation.logger().warn("HTTP Response code was not 200")
          conversation.transition('failure')
          done()
        }  
      })

      .then(function (data) {
        conversation.logger().info("Data received from API")

        const shortAnswerJsonAttribute = "answer_box"
        const shortAnswerJsonSubattributes = ["answer", "snippet", "result", "dates"]
        const longAnswerJsonAttribute = "knowledge_graph"
        const longAnswerJsonSubattributes = ["description"]

        // Look for Short Answers
        var shortAnswerFound = 0;
        var _shortAnswer = "";
        if (data.hasOwnProperty(shortAnswerJsonAttribute)) {
          for (let i = 0; i < shortAnswerJsonSubattributes.length; i++) {
            if (data[shortAnswerJsonAttribute].hasOwnProperty(shortAnswerJsonSubattributes[i])) {
              if(shortAnswerJsonSubattributes[i] == "dates"){
                var len = data[shortAnswerJsonAttribute][shortAnswerJsonSubattributes[i]].length;
                if (len == 1){
                  _shortAnswer = data[shortAnswerJsonAttribute][shortAnswerJsonSubattributes[i]][0].toString();
                  shortAnswerFound = 1;
                }
                else if(len == 2){
                  _shortAnswer = "From " + data[shortAnswerJsonAttribute][shortAnswerJsonSubattributes[i]][0].toString() + " To " + data[shortAnswerJsonAttribute][shortAnswerJsonSubattributes[i]][1].toString();
                  shortAnswerFound = 1;
                }
                else{
                  shortAnswerFound = 0;
                }
              }
              else{
                _shortAnswer = data[shortAnswerJsonAttribute][shortAnswerJsonSubattributes[i]].toString();
                shortAnswerFound = 1;
              }
              conversation.logger().info("Short Answer received: " + _shortAnswer + " under sub-attribute: " + shortAnswerJsonSubattributes[i]);
            }
          }
          if (shortAnswerFound == 0) {
            conversation.logger().info("SubAttribute of short answer not found for the question: " + question);
          }
        }
        else{
          conversation.logger().info("No Short Answer found");
        }

        // Look for Long Answers
        var longAnswerFound = 0;
        var _longAnswer = "";
        if (data.hasOwnProperty(longAnswerJsonAttribute)) {
          for (let i = 0; i < longAnswerJsonSubattributes.length; i++) {
            if (data[longAnswerJsonAttribute].hasOwnProperty(longAnswerJsonSubattributes[i])) {
              _longAnswer = data[longAnswerJsonAttribute][longAnswerJsonSubattributes[i]];
              longAnswerFound = 1;
              conversation.logger().info("Long Answer received: " + _longAnswer + " under sub-attribute: " + longAnswerJsonSubattributes[i]);
            }
          }
          if (longAnswerFound == 0) {
            conversation.logger().info("SubAttribute of long answer not found for the question: " + question);
          }
        }
        else{
          conversation.logger().info("No Long Answer found");
        }

        // Data to be returned back
        let result = {}
        result.longAnswerFound = longAnswerFound;
        result.longAnswer = _longAnswer;
        result.shortAnswerFound = shortAnswerFound;
        result.shortAnswer = _shortAnswer;

        if (shortAnswerFound == 0 && longAnswerFound == 0) {
          conversation.transition('answerNotFound');
        }
        else if (shortAnswerFound == 0 && longAnswerFound == 1){
          conversation.setVariable(variable, result);
          conversation.transition('longAnswerFound');
          conversation.keepTurn(true);
        }
        else if (shortAnswerFound == 1 && longAnswerFound == 0){
          conversation.setVariable(variable, result);
          conversation.transition('shortAnswerFound');
          conversation.keepTurn(true);
        }
        else{
          conversation.setVariable(variable, result);
          conversation.transition('shortAndLongAnswerFound');
          conversation.keepTurn(true);
        }

        done()
      })

      .catch( function (err) {
        d = new Date();
        const errMsg = "THIS API returned FAILURE: "+ d.toISOString();
        conversation.logger().info(errMsg);
        respondToBotWithFailure(err);
      })

    }
    catch(err) {
      respondToBotWithFailure(err);
    }

    async function respondToBotWithFailure(error) {
      conversation.logger().info("The error: "+error);
      conversation.keepTurn(true);
      conversation.transition('failure');
      done(); 
    }
  }
};