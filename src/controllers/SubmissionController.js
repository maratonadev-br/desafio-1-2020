const { getCredentials } = require('./VRController');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  submit: async (req, res) => {
    let response;
    if (req.body.password !== process.env.DEPLOYMENT_PASSWORD) {
      response = {
        err: true,
        msg:
          'A senha digitada é inválida. Caso tenha esquecido a senha, apague sua aplicação pela lista de recursos da IBM Cloud e realize o deploy novamente.'
      };
    } else {
      const credentialsResponse = getCredentials();
      if (credentialsResponse.err === true) {
        response = credentialsResponse;
      } else {
        const submissionResponse = await axios.post(
          'https://submission.maratona.dev/api/v1/desafios/dvr',
          {
            ...credentialsResponse.credentials,
            email: process.env.USER_EMAIL
          }
        );
        console.log('Submission response:', submissionResponse.data);
        let msg;
        switch (submissionResponse.data.code) {
          case 200:
            msg = `Clique no link enviado para o seu e-mail (${process.env.USER_EMAIL}) para concluir a submissão.`;
            break;
          case 502:
            msg = 'Você já atingiu o limite de submissões.';
            break;
          case 504:
            msg = `O usuário com e-mail ${process.env.USER_EMAIL} não foi encontrado. Para trocar o e-mail, apague a sua aplicação pela lista de recursos da IBM Cloud e realize o deploy novamente.`;
            break;
          case 503:
            msg =
              'As credenciais do modelo estão incorretas. Troque-as clicando no botão de configuração no canto superior direito.';
            break;
          case 500:
          case 501:
          default:
            msg =
              'Houve algum erro durante a sua submissão. Por favor, realize o deploy da aplicação novamente. Se o problema persistir, contate um supervisor.';
            break;
        }
        if (submissionResponse.data.code === 200) {
          response = {
            err: false,
            msg
          };
        } else {
          response = {
            err: true,
            msg
          };
        }
      }
    }
    return res.json(response);
  }
};
