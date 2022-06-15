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
      variable: {required: true,type: 'string'},
      question: {required: true,type: 'string'}
    },
    supportedActions: ['answerFound', 'answerNotFound']
  }),


  /**
   * invoke methods gets called when the custom component state is executed in the dialog flow
   * @param {CustomComponentContext} conversation
  */
  invoke: async (conversation, done) => {
    try {
      var d = new Date();
      conversation.logger().info("Invoke called in custom component: "+ d.toISOString());
      // conversation.reply("Invoke called in custom component: "+ d.toISOString());  
      
      const { variable } = conversation.properties();
      const { question } = conversation.properties();

      // Log info to console
      conversation.logger().info("Input Parameters: Variable: " + variable + ", Question: " + question);
  
      // Make the URL
      const apiKey = "aee9322b6235d76fa7b8a8de81ff5911338e54c47cb07f8eb451d86d5f08dadb";
      // const search = new SerpApi.GoogleSearch(apiKey);
      var questionInUrl = encodeURIComponent(question)
      var reqUrl = "https://serpapi.com/search.json?engine=google&q=" + questionInUrl + "&google_domain=google.com&gl=us&hl=en&api_key=" + apiKey

      const axios = require('axios');

      conversation.logger().info("Calling API: "+ d.toISOString());
      // conversation.reply("Calling API: "+ d.toISOString());
      conversation.logger().info("Request URL: " + reqUrl)
      conversation.logger().info("API Key: " + apiKey)
      
      // Call the API
      axios.get(reqUrl, {})

      .then(function (response) {
        conversation.logger().info("Response received: " + response)
        if (response.status === 200) {
          return response.data
        } else {
          conversation.logger().warn("HTTP Response code was not 200")
          conversation.transition('failure')
          done()
        }  
      })

      .then(function (data) {
        conversation.logger().info("Data received from API: ", data)

        const shortAnswerJsonAttribute = "answer_box"
        const shortAnswerJsonSubattributes = ["answer", "snippet", "result"]
        const longAnswerJsonAttribute = "knowledge_graph"
        const longAnswerJsonSubattributes = ["description"]

        // Look for Short Answers
        var shortAnswerFound = 0;
        var _shortAnswer = "";
        if (data.hasOwnProperty(shortAnswerJsonAttribute)) {
          for (let i = 0; i < shortAnswerJsonSubattributes.length; i++) {
            if (data[shortAnswerJsonAttribute].hasOwnProperty(shortAnswerJsonSubattributes[i])) {
              _shortAnswer = data[shortAnswerJsonAttribute][shortAnswerJsonSubattributes[i]];
              shortAnswerFound = 1;
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
        else{
          conversation.setVariable(variable, result);
          conversation.transition('answerFound');
          conversation.keepTurn(true);
        }

        done()
      })

      .catch( function (err) {
        d = new Date();
        const errMsg = "THIS API returned FAILURE: "+ d.toISOString();
        conversation.logger().info(errMsg);
        conversation.reply(errMsg);
        respondToBotWithFailure(err);
      })

    }
    catch(err) {
      respondToBotWithFailure(err);
    }

    async function respondToBotWithFailure(error) {
      conversation.logger().info("The error: "+error);
      // You can comment the following reply if you want skill to not display a message.
      conversation.reply("The error: "+error);
      conversation.keepTurn(true);
      conversation.transition('failure');
      done(); 
    }
    


    // const params = {
    //   engine: "google",
    //   q: question,
    //   google_domain: "google.com",
    //   gl: "us",
    //   hl: "en"
    // };

    // var tmpTargetCurrencies = targetCurrencies+","+baseCurrency
    // var fixerIoAPIKey = "n9KlzeA4qpmezrInIFo9jAsLNO0f3CPn"
    // var reqUrl = "http://data.fixer.io/api/latest?access_key="+fixerIoAPIKey + "&base=EUR&symbols=" + tmpTargetCurrencies
    // // hide API key from logs
    // conversation.logger().info("fixer.io request URL:"+reqUrl.replace(fixerIoAPIKey,"*********"))

    // fetch(reqUrl)
    // .then((response) => {
    //   if (response.status === 200) {
    //     return response.json()
    //   } else {
    //     context.logger().warn("HTTP status code: " + response.statusCode)
    //     context.transition('failure')
    //     done()
    //   }
    // })
    // .then((data) => {
    //   context.logger().info("Successful conversion")
    //   if (data.success) {
    //     var _conversionArray = []
    //     for (let property in data.rates) {
    //       if (property.toUpperCase() != baseCurrency.toUpperCase()) {
    //         let _conversionRate = data.rates[property] / data.rates[baseCurrency.toUpperCase()]
    //         let obj = {}
    //         obj.symbol = property
    //         obj.conversionRate = _conversionRate
    //         obj.amount = _conversionRate * amount
    //         context.logger().info(baseCurrency.toUpperCase() + " to " + property + "")
    //         _conversionArray.push(obj)
    //       }
    //     }
    //     context.logger().info("converted currencies: " + _conversionArray.toString())
    //     let result = {}
    //     result.date = data.date
    //     result.base = {}
    //     result.base.symbol = baseCurrency
    //     result.base.amount = amount
    //     result.conversion = _conversionArray

    //     context.setVariable(variable, result)
    //     context.transition('success')
    //     context.keepTurn(true)
    //   } else {
    //     if (data.hasOwnProperty("error")) {
    //       context.logger().warn("Error type: " + data.error.type)
    //       context.logger().warn("Error message: " + data.error.info)
    //     }
    //     context.transition('failure')
    //   }
    //   done()      
    // })
    // .catch((err) => {
    //   done(err)
    // });
    

    // const callback = function(data) {
    //   context.logger().info("Entering callback function");
    //   context.logger().info(data);
    //   const shortAnswerJsonAttribute = "answer_box"
    //   const shortAnswerJsonSubattributes = ["answer", "snippet", "result"]
    //   const longAnswerJsonAttribute = "knowledge_graph"
    //   const longAnswerJsonSubattributes = ["description"]

    //   // Look for Short Answers
    //   var shortAnswerFound = 0;
    //   var _shortAnswer = "";
    //   if (data.hasOwnProperty(shortAnswerJsonAttribute)) {
    //     for (let i = 0; i < shortAnswerJsonSubattributes.length; i++) {
    //       if (data[shortAnswerJsonAttribute].hasOwnProperty(shortAnswerJsonSubattributes[i])) {
    //         _shortAnswer = data[shortAnswerJsonAttribute][shortAnswerJsonSubattributes[i]];
    //         shortAnswerFound = 1;
    //         context.logger().info("Short Answer received: " + _shortAnswer + " under sub-attribute: " + shortAnswerJsonSubattributes[i]);
    //       }
    //     }
    //     if (shortAnswerFound == 0) {
    //       context.logger().info("SubAttribute of short answer not found for the question: " + question);
    //     }
    //   }
    //   else{
    //     context.logger().info("No Short Answer found");
    //   }

    //   // Look for Short Answers
    //   var longAnswerFound = 0;
    //   var _longAnswer = "";
    //   if (data.hasOwnProperty(longAnswerJsonAttribute)) {
    //     for (let i = 0; i < longAnswerJsonSubattributes.length; i++) {
    //       if (data[longAnswerJsonAttribute].hasOwnProperty(longAnswerJsonSubattributes[i])) {
    //         _longAnswer = data[longAnswerJsonAttribute][longAnswerJsonSubattributes[i]];
    //         longAnswerFound = 1;
    //         context.logger().info("Long Answer received: " + _longAnswer + " under sub-attribute: " + longAnswerJsonSubattributes[i]);
    //       }
    //     }
    //     if (longAnswerFound == 0) {
    //       context.logger().info("SubAttribute of long answer not found for the question: " + question);
    //     }
    //   }
    //   else{
    //     context.logger().info("No Long Answer found");
    //   }

    //   // Data to be returned back
    //   result = {}
    //   result.longAnswerFound = longAnswerFound;
    //   result.longAnswer = _longAnswer;
    //   result.shortAnswerFound = shortAnswerFound;
    //   result.shortAnswer = _shortAnswer;

    //   if (shortAnswerFound == 0 && longAnswerFound == 0) {
    //     context.transition('answerNotFound');
    //   }
    //   else{
    //     context.setVariable(variable, result);
    //     context.transition('answerFound');
    //     context.keepTurn(true);
    //   }

    //   done();

    // };
    
    // // Show result as JSON
    // search.json(params, callback);
  }
};