const OracleBot = require('@oracle/bots-node-sdk');
const Util = require('@oracle/bots-node-sdk/util');
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;
const bodyParser = require('body-parser');
const { dialogflow } = require('actions-on-google');
const assistant = dialogflow();

module.exports = (app) => {
  const logger = console;
  OracleBot.init(app, {
    logger,
  });

  const webhook = new WebhookClient({
    channel: {
      url: 'http://2b2d3e3d.ngrok.io/connectors/v1/tenants/chatbot-tenant/listeners/webhook/channels/291868e7-1eeb-490d-9fe5-c84362f34492',
      secret: 'BpZMnlY64tzVoBZHRtcgNvvs90ZE8lN6',
    }
  });

  webhook
    .on(WebhookEvent.ERROR, err => logger.error('Error:', err.message))
    .on(WebhookEvent.MESSAGE_SENT, message => logger.info('Message to chatbot:', message))
    .on(WebhookEvent.MESSAGE_RECEIVED, message => logger.info('Message from chatbot:', message))

  
  assistant.intent('Default Fallback Intent', (conv) => {
    logger.info('Got query : ', conv.query);
    logger.info('qual a conversation total : ', JSON.stringify(conv));
    const promise = new Promise(function (resolve, reject) {
      const MessageModel = webhook.MessageModel();
      const message = {
        userId: 'anonymous',
        messagePayload: MessageModel.textConversationMessage(conv.query)
      };
      logger.info('messagepayload : ', message.messagePayload);
      webhook.send(message);
      webhook.on(WebhookEvent.MESSAGE_RECEIVED, message => {
        resolve(message);
      });
    })
      .then(function (result) {
          var texto1 = '';
          var texto2 = '';
          texto1 = result.messagePayload.text;
          if (result.messagePayload.actions){
            texto2 = Util.actionsToText(result.messagePayload.actions,texto1);
            texto1 = '';
          }
          conv.ask(texto1+texto2);
        })
    return promise;
  })
  
  app.post('/bot/message', webhook.receiver());

  app.use('/fulfillment',bodyParser.json(),assistant);
  app.post('/fulfillment', assistant );
}