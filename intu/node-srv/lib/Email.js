"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
class Email {
    send(email, emailjsService_id, emailjsTemplate_id, emailjsUser_id, msg) {
        axios_1.default.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: emailjsService_id,
            template_id: emailjsTemplate_id,
            user_id: emailjsUser_id,
            template_params: {
                to_name: email,
                message_html: msg,
                email_to: email
            }
        })
            .then(res => {
            console.info('Email has been sent. Result', res);
        })
            .catch(err => {
            console.info('Email has not been sent. Erro', err);
        });
    }
}
exports.Email = Email;
module.exports = {
    Email
};
