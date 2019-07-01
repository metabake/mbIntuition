"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FileOpsExtra_1 = require("mbake/lib/FileOpsExtra");
const Email_1 = require("./Email");
const Wa_1 = require("mbake/lib/Wa");
const fs = require('fs-extra');
var path = require('path');
function adminRoutes(adbDB, host, appPort, mainEApp) {
    const emailJs = new Email_1.Email();
    mainEApp.handleRRoute('api/admin', 'checkAdmin', (req, res) => {
        const method = req.fields.method;
        let params = JSON.parse(req.fields.params);
        let email = params.admin_email;
        let password = params.admin_pass;
        let resp = {};
        if ('check-admin' == method) {
            resp.result = {};
            try {
                resp.result = true;
                return res.json(resp);
            }
            catch (err) {
            }
        }
        else {
            return res.json(resp);
        }
    });
    mainEApp.handleRRoute('api/admin', 'setup-app', async (req, res) => {
        const method = req.fields.method;
        let params = JSON.parse(req.fields.params);
        let item = params.item;
        let resp = {};
        console.log('-------res.locals', res.locals.email);
        if ('setup-app' == method) {
            resp.result = {};
            try {
                var setupItem = '';
                switch (item) {
                    case 'blog':
                        setupItem = 'CMS';
                        await new FileOpsExtra_1.Download('CMS', path.join(__dirname, '../')).autoUZ();
                        break;
                    case 'shop':
                        setupItem = 'e-com';
                        console.log("TCL: AdminRoutes -> routes -> setupItem", setupItem);
                        await new FileOpsExtra_1.Download('SHOP', path.join(__dirname, '../')).autoUZ();
                        break;
                    case 'website':
                        setupItem = 'website';
                        await new FileOpsExtra_1.Download('website', path.join(__dirname, '../')).autoUZ();
                        break;
                }
                let adminId = await adbDB.getAdminId(res.locals.email);
                await adbDB.setupApp(path.join(__dirname, '../' + setupItem), adminId[0].id)
                    .then(function (result) {
                    resp.result = true;
                    return res.json(resp);
                }).then(() => {
                    setTimeout(function () {
                        Wa_1.Wa.watch(path.join(__dirname, '../' + setupItem), 3000);
                    }, 10000);
                });
            }
            catch (err) {
            }
        }
        else {
            return res.json(resp);
        }
    });
    mainEApp.handleRRoute('api/admin', 'get-config', (req, res) => {
        console.log('api/admin ,get-config');
        const method = req.fields.method;
        let params = JSON.parse(req.fields.params);
        let item = params.item;
        let resp = {};
        if ('get-config' == method) {
            resp.result = {};
            try {
                var setupItem = '';
                adbDB.getAdminId(res.locals.email)
                    .then(function (adminId) {
                    adbDB.getConfigs(adminId[0].id)
                        .then(function (result) {
                        let temp = {};
                        temp['port'] = result.port;
                        temp['pathToSite'] = result.pathToSite;
                        resp.result = temp;
                        return res.json(resp);
                    });
                });
            }
            catch (err) {
            }
        }
        else {
            return res.json(resp);
        }
    });
    mainEApp.handleRRoute('api/admin', 'update-config', (req, res) => {
        const method = req.fields.method;
        let params = JSON.parse(req.fields.params);
        let path = params.path;
        let port = params.port;
        let printfulApi = params.printfulApi;
        let resp = {};
        if ('update-config' == method) {
            resp.result = {};
            try {
                adbDB.getAdminId(res.locals.email)
                    .then(function (adminId) {
                    adbDB.updateConfig(path, port, printfulApi, adminId[0].id)
                        .then(function (result) {
                        console.log("TCL: AdminRoutes -> routes -> result", result);
                        let temp = {};
                        temp['port'] = port;
                        temp['pathToSite'] = path;
                        temp['printfulApi'] = printfulApi;
                        resp.result = temp;
                        if (port != appPort) {
                            res.json(resp);
                            process.exit();
                        }
                        res.json(resp);
                    });
                });
            }
            catch (err) {
            }
        }
        else {
            return res.json(resp);
        }
    });
    mainEApp.handleRRoute('api/admin', 'resetPassword', (req, res) => {
        const method = req.fields.method;
        let params = JSON.parse(req.fields.params);
        let email = params.admin_email;
        let resp = {};
        if ('code' == method) {
            resp.result = {};
            try {
                var code = adbDB.sendVcode(email)
                    .then(function (code) {
                    adbDB.getEmailJsSettings()
                        .then(settings => {
                        let setting = settings[0];
                        emailJs.send(email, setting.emailjsService_id, setting.emailjsTemplate_id, setting.emailjsUser_id, 'your code: ' + code);
                        console.info('code', code);
                        resp.result = true;
                        return res.json(resp);
                    });
                });
            }
            catch (err) {
            }
        }
        else if ('reset-password' == method) {
            resp.result = {};
            adbDB.resetPassword(email, params.code, params.password)
                .then(function (result) {
                resp.result = result;
                return res.json(resp);
            });
        }
        else {
            return res.json(resp);
        }
    });
    mainEApp.handleRRoute('api/admin', "editors", (req, res) => {
        const method = req.fields.method;
        let resp = {};
        if ('get' == method) {
            adbDB.getEditors()
                .then(function (editors) {
                console.info("--editors:", editors);
                let data = [];
                editors.map(function (editor) {
                    data.push({
                        id: editor.id,
                        email: editor.email,
                        name: editor.name
                    });
                });
                resp.result = data;
                return res.json(resp);
            });
        }
        else {
            return res.json(resp);
        }
    });
    mainEApp.handleRRoute('api/admin', "editors-add", (req, res) => {
        const method = req.fields.method;
        let resp = {};
        let params = JSON.parse(req.fields.params);
        if ('post' == method) {
            let email = params.email;
            let name = params.name;
            let password = params.password;
            if (typeof email !== 'undefined' &&
                typeof name !== 'undefined' &&
                typeof password !== 'undefined') {
                adbDB.addEditor(email, name, password)
                    .then(function (editorId) {
                    let response = {
                        id: editorId
                    };
                    adbDB.getEmailJsSettings()
                        .then(settings => {
                        adbDB.getAdminId(res.locals.email)
                            .then(function (adminId) {
                            adbDB.getConfigs(adminId[0].id)
                                .then(function (result) {
                                let port = result.port;
                                let setting = settings[0];
                                let link = 'http://localhost:' + port + '/editors/?email=' + encodeURIComponent(email);
                                let msg = 'Hi, on this email was created editor account for WebAdmin. Please reset your password following this link: ' + link;
                                emailJs.send(email, setting.emailjsService_id, setting.emailjsTemplate_id, setting.emailjsUser_id, msg);
                                resp.result = response;
                                return res.json(resp);
                            });
                        });
                    });
                });
            }
            else {
                res.status(400);
                resp.result = { error: 'parameters missing' };
                res.json(resp);
            }
        }
        else {
            return res.json(resp);
        }
    });
    mainEApp.handleRRoute('api/admin', "editors-edit", (req, res) => {
        const method = req.fields.method;
        let resp = {};
        let params = JSON.parse(req.fields.params);
        if ('put' == method) {
            let name = params.name;
            let userId = params.uid;
            if (typeof name !== 'undefined' &&
                typeof userId !== 'undefined') {
                adbDB.editEditor(name, userId)
                    .then(function (editorId) {
                    console.info("--editorId:", editorId);
                    let response = {
                        id: editorId
                    };
                    resp.result = response;
                    return res.json(resp);
                });
            }
            else {
                res.status(400);
                resp.result = { error: 'parameters missing' };
                res.json(resp);
            }
        }
        else {
            return res.json(resp);
        }
    });
    mainEApp.handleRRoute('api/admin', "editors-delete", (req, res) => {
        const method = req.fields.method;
        let resp = {};
        let params = JSON.parse(req.fields.params);
        if ('delete' == method) {
            let userId = params.uid;
            if (typeof userId !== 'undefined') {
                adbDB.deleteEditor(userId)
                    .then(function (editorId) {
                    console.info("--editor have been removed:", editorId);
                    resp.result = {};
                    res.json(resp);
                })
                    .catch(function (error) {
                    res.status(400);
                    resp.result = { error: error.message };
                    res.json(resp);
                });
            }
            else {
                res.status(400);
                resp.result = { error: 'parameters missing' };
                res.json(resp);
            }
        }
        else {
            return res.json(resp);
        }
    });
}
exports.adminRoutes = adminRoutes;
;