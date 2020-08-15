const VisualRecognitionV3 = require('ibm-watson/visual-recognition/v3');
const { IamAuthenticator } = require('ibm-watson/auth');
const fs = require('fs');
require('dotenv').config();

const initialCredentials = {
  apikey: process.env.VR_APIKEY,
  url: process.env.VR_URL,
  collectionId: process.env.VR_COLLECTION_ID
};

const analyze = async (img, model, credentials) => {
  let response;
  try {
    const classifyParams = {
      imagesFile: fs.createReadStream(img),
      classifierIds: [credentials.collectionId],
      threshold: 0
    };
    const vrResponse = await model.classify(classifyParams);
    fs.unlinkSync(img);
    response = {
      err: false,
      result: vrResponse.result.images[0].classifiers[0].classes
    };
  } catch (err) {
    console.error(err);
    response = {
      err: true,
      msg: 'Houve algum erro durante a chamada ao serviço.'
    };
  }
  return response;
};

const changeModel = async (newCredentials) => {
  if (
    !newCredentials.apikey ||
    !newCredentials.url ||
    !newCredentials.collectionId
  ) {
    console.error(
      'Change model error - the following credentials are not valid:',
      newCredentials
    );
    return {
      err: true,
      msg: 'As credenciais inseridas são inválidas. Por favor, tente novamente.'
    };
  } else {
    let response;
    try {
      const newModel = new VisualRecognitionV3({
        version: '2018-03-19',
        authenticator: new IamAuthenticator({
          apikey: newCredentials.apikey
        }),
        url: newCredentials.url
      });
      const classifyParams = {
        imagesFile: fs.createReadStream('./images/sample.jpg'),
        classifierIds: [newCredentials.collectionId],
        threshold: 0.001
      };
      await newModel.classify(classifyParams);
      response = {
        err: false,
        model: newModel,
        credentials: newCredentials
      };
    } catch {
      response = {
        err: true,
        msg:
          'As credenciais inseridas são inválidas. Por favor, tente novamente.'
      };
    }
    return response;
  }
};

let currentModel = null,
  currentCredentials = null,
  valid = false;

changeModel(initialCredentials)
  .then((res) => {
    if (res.err === true) {
      console.log(res);
      console.error('ERROR - invalid initial credentials provided.');
    } else {
      currentModel = res.model;
      currentCredentials = res.credentials;
      valid = true;
    }
  })
  .catch((err) => {
    console.log(err);
    console.error('ERROR - invalid initial credentials provided.');
  });

module.exports = {
  changeCredentials: async (req, res) => {
    if (req.body.password !== process.env.DEPLOYMENT_PASSWORD) {
      return res.json({
        err: true,
        msg:
          'A senha digitada é inválida. Caso tenha esquecido a senha, apague sua aplicação pela lista de recursos da IBM Cloud e realize o deploy novamente.'
      });
    }
    const newModel = await changeModel(req.body);
    let response;
    if (newModel.err === true) {
      response = newModel;
    } else {
      currentModel = newModel.model;
      currentCredentials = newModel.credentials;
      valid = true;
      response = {
        err: false,
        msg: 'Modelo trocado com sucesso.'
      };
    }
    return res.json(response);
  },
  getCredentials: () => {
    let response;
    if (valid === true) {
      response = {
        err: false,
        credentials: {
          ...currentCredentials
        }
      };
    } else {
      response = {
        err: true,
        msg:
          'As credenciais do modelo não estão válidas. Troque-as clicando no botão de configuração acima.'
      };
    }
    return response;
  },
  analyze: async (req, res) => {
    let response;
    if (valid === true) {
      response = await analyze(req.file.path, currentModel, currentCredentials);
    } else {
      response = {
        err: true,
        msg:
          'As credenciais do modelo não estão válidas. Troque-as clicando no botão de configuração acima.'
      };
    }
    return res.json(response);
  }
};
