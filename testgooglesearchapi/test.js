'use strict';

module.exports = {
  metadata: () => ({
    name: 'axios.sample',
    properties: {
      variable: {required: true,type: 'string'},
      baseCurrency: {required: true,type: 'string'},
      targetCurrencies: {required: true,type: 'string'},
      amount: {required: true,type: 'int'}
    },
    supportedActions: ['success', 'failure']
  }),
  invoke: (conversation, done) => {
    try {
        var d = new Date();
        conversation.logger().info("Invoke called in custom component: "+ d.toISOString());
        conversation.reply("Invoke called in custom component: "+ d.toISOString());
        //get access to variable to write response to 
        const { variable } = conversation.properties();
        const axios = require('axios');

        conversation.logger().info("Calling API: "+ d.toISOString());
        conversation.reply("Calling API: "+ d.toISOString());

        // Uncomment the following to raise an exception
        // I_AM_NULL.NULL
        
        // Uncomment the following to raise an exception
        // Following will give ENOTFOUND
        //axios.get('https://<THIS_IS_INVALID_URL>', {})

        // Following will give 404
        // axios.get('https://gorest.co.in/public/v2/blahblah', {})

        // Following will succeed
        var tmpTargetCurrencies = targetCurrencies+","+baseCurrency
        var fixerIoAPIKey = "n9KlzeA4qpmezrInIFo9jAsLNO0f3CPn"
        var reqUrl = "http://data.fixer.io/api/latest?access_key="+fixerIoAPIKey + "&base=EUR&symbols=" + tmpTargetCurrencies
        axios.get(reqUrl, {})

        .then(function (response) {
          if (response.status === 200) {
            return response.json()
          } else {
            context.logger().warn("HTTP status code: " + response.statusCode)
            context.transition('failure')
            done()
          }
        //   d = new Date();

        // // Uncomment the following to raise an exception
        // // I_AM_NULL.NULL

        //   const msg = "THIS API returned success: "+ d.toISOString();
        //   const parsedData = response.data;
        //   conversation.variable(variable, parsedData)
        //   conversation.keepTurn(true);
        //   conversation.transition('success');
        //   done();   
        })

        .then((data) => {
          context.logger().info("Successful conversion")
          if (data.success) {
            var _conversionArray = []
            for (let property in data.rates) {
              if (property.toUpperCase() != baseCurrency.toUpperCase()) {
                let _conversionRate = data.rates[property] / data.rates[baseCurrency.toUpperCase()]
                let obj = {}
                obj.symbol = property
                obj.conversionRate = _conversionRate
                obj.amount = _conversionRate * amount
                context.logger().info(baseCurrency.toUpperCase() + " to " + property + "")
                _conversionArray.push(obj)
              }
            }
            context.logger().info("converted currencies: " + _conversionArray.toString())
            let result = {}
            result.date = data.date
            result.base = {}
            result.base.symbol = baseCurrency
            result.base.amount = amount
            result.conversion = _conversionArray
    
            context.setVariable(variable, result)
            context.transition('success')
            context.keepTurn(true)
          } else {
            if (data.hasOwnProperty("error")) {
              context.logger().warn("Error type: " + data.error.type)
              context.logger().warn("Error message: " + data.error.info)
            }
            context.transition('failure')
          }
          done()      
        })

        .catch(function (error) {
          d = new Date();
          const errMsg = "THIS API returned FAILURE: "+ d.toISOString();
          conversation.logger().info(errMsg);
          conversation.reply(errMsg);
          conversation.variable(variable, errMsg)
          // send error back to the skill
          respondToBotWithFailure(error);
        });
    } catch(error) {
       // send error back to the skill
      respondToBotWithFailure(error);
    }

    async function respondToBotWithFailure(error) {
      conversation.logger().info("The error: "+error);
      // You can comment the following reply if you want skill to not display a message.
      conversation.reply("The error: "+error);
      conversation.keepTurn(true);
      conversation.transition('failure');
      done(); 
    }
  }
}