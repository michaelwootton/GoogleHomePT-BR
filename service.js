const OracleBot = require('@oracle/bots-node-sdk');
const { messageModelUtil } = require('./lib/MessageModel/messageModelUtil.js');
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;
const bodyParser = require('body-parser');
const { dialogflow, SignIn } = require('actions-on-google');
const assistant = dialogflow({debug: true, clientId:'368886720564-ffahuvlrge7h59qks2n0t1o7lbujnodt.apps.googleusercontent.com',});

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

    if (conv.user.profile.payload.given_name === '') {
      logger.info('Vai entrar no fluxo de Signin');
      conv.ask(new SignIn('Para pegar os detalhes da sua conta do Google, como nome e email, responda Sim'));
      logger.info('saiu do fluxo de Signin');
      UserId = 'anonymus';
    } else {
      userlocale = conv.user.locale;
      logger.info('Account Linking rolou no default fallback, dados de locale são: ', userlocale);
      userpayload = conv.user.profile.payload;
      UserId = userpayload.sub;
      logger.info('Account Linking rolou no default fallback, dados de Conv são: ', JSON.stringify(conv));
      logger.info('Account Linking rolou no default fallback, dados do given_name: ', JSON.stringify(conv.user.profile.payload.given_name));      UserId = userpayload.sub;
      logger.info('Estes é o user ID do Conv: ', UserId);
      Username = userpayload.given_name;
      logger.info('Este é o nome do usuario do Conv no Fallback: ', Username);
    }
    const promise = new Promise(function (resolve, reject) {
      const MessageModel = webhook.MessageModel();
      const message = {
        userId: UserId,
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
          logger.info('actions : ', JSON.stringify(result.messagePayload.actions));
          if (result.messagePayload.actions){
            texto2 = actionsToText(result.messagePayload.actions,texto1);
            texto1 = '';
          }
          conv.ask('<speak>'+texto1+texto2+'</speak>');
        })
    return promise;
  })
  
  assistant.intent('SIGN_IN',(conv, params, signin) => {
    logger.info('Recebi o retorno via treatuser e vou verificar o userid');

    // se l'input e' fine usa il metodo tell() che risponde e chiude la connessione
    if (signin.status === 'OK') {
      userlocale = conv.user.locale;
      logger.info('Account Linking rolou no default fallback, dados de locale são: ', userlocale);
      userpayload = conv.user.profile.payload;
      logger.info('Account Linking rolou, dados de profile são: ', JSON.stringify(signin));
      logger.info('Account Linking rolou, dados de Conv são: ', JSON.stringify(conv));
      logger.info('Account Linking rolou, dados de params são: ', JSON.stringify(params));
      logger.info('Estes são os dados do given_name: ', JSON.stringify(conv.user.profile.payload.given_name));      UserId = userpayload.sub;
      UserId = userpayload.sub;
      logger.info('Estes é o user ID do Conv: ', UserId);
      Username = userpayload.given_name;
      logger.info('Este é o nome do usuario do Conv: ', Username);
      conv.ask('Olá ' + Username + ', o que posso fazer por vc ?');
    } else {
      UserId = 'anonymus';
      conv.ask('Olá, como vc não forneceu seus dados, vou ter que pedir durante o processo algumas informações'
      + ', o que posso fazer por vc ?');
    }
 
   
  }); // treatuser

  function trailingPeriod(text) {
    if (!text || (typeof text !== 'string')) {
      return '';
    }
    return ((text.trim().endsWith('.') || text.trim().endsWith('?') || text.trim().endsWith(',')) ? text.trim() + ' ' : text.trim() + '. ');
  }
  
  function actionToText(action, actionPrefix) {
    var actionText = (actionPrefix ? actionPrefix + ' ' : '');
    if (action.label) {
      return actionText + action.label;
    }
    else {
      switch (action.type) {
      case 'postback':
        break;
      case 'call':
        actionText += 'Chame o fone de numero ' + action.phoneNumber;
        break;
      case 'url':
        actionText += 'Abra a URL ' + action.url;
        break;
      case 'share':
        actionText += 'Compartilhe a mensagem ';
        break;
      case 'location':
        actionText += 'Compartilhe a localização';
        break;
      default:
        break;
      }
    }
    return actionText;
  }
  
  function actionsToText(actions, prompt, actionPrefix) {
    var actionsText = prompt || 'You can choose from the following actions: ';
    actions.forEach(function (action, index) {
      actionsText = actionsText + actionToText(action, actionPrefix);
      if (index < actions.length - 1) {
        actionsText = actionsText + ', ';
      }
    });
    return trailingPeriod(actionsText);
  }
  app.post('/bot/message', webhook.receiver());

  app.use('/fulfillment',bodyParser.json(),assistant);
 
  app.post('/fulfillment', assistant );
}