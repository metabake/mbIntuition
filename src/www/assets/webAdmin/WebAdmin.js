/**
 * 
 * All rights reserved by MetaBake (MetaBake.org), licensed under LGPL 3.0
 *
 */

/**
 * CRUD .md files and post creation from blog mounted app
 */
class WebAdmin {

    /**
     * @param apiProtocol api protocol (example: http)
     * @param apiHost api host (example: 0.0.0.0)
     * @param apiPort api port (example: 9081)
     */
    constructor() {
        this.serviceRPC = new httpRPC(apiProtocol, apiHost, apiPort);
    }

    checkEditor(email, pass) {
        console.info("--email:", email)
        console.info("--pass:", pass)
        let _this = this
        return this.serviceRPC.invoke('/api/editors/checkEditor', 'check-editor', { editor_email: email, editor_pass: pass })
            .then(function(result) {
                if (result) {
                    _this.serviceRPC.setUser(email, pass);
                    return true
                } else {
                    return false
                }
            })
    }

    /**
     * get list of directories
     */
    getDirsList() {
        return this.serviceRPC.invoke('/api/editors/posts', 'get', {
            editor_email: window.sessionStorage.getItem('username'),
            editor_pass: window.sessionStorage.getItem('password')
        });
    }

    /**
     * get directories' subdirectories list
     * @param id path to post, eg: 'blog/post-2'
     */
    getSubDirsList(id) {
        return this.serviceRPC.invoke('/api/editors/files', 'get', {
            post_id: id,
            editor_email: window.sessionStorage.getItem('username'),
            editor_pass: window.sessionStorage.getItem('password')
        });
    }

    /**
     * get files
     * @param id file name, eg: '/title.md'
     * @param pathPrefix path to file, eg: 'blog/post-4'
     */
    getPostMd(id, pathPrefix) {
        return this.serviceRPC.invoke('/api/editors/post-get', 'get', {
            post_id: id,
            pathPrefix: pathPrefix,
            editor_email: window.sessionStorage.getItem('username'),
            editor_pass: window.sessionStorage.getItem('password')
        });
    }

    /**
     * save file and run mbake
     * @param id file name, eg: '/title.md'
     * @param md file content, eg: '###### Lorem ipsum dd dolor sit {.title}'
     * @param pathPrefix path to file, eg: 'blog/post-4'
     */
    savePostMd(id, md, pathPrefix) {
        return this.serviceRPC.invoke('/api/editors/post-put', 'put', {
            post_id: id,
            pathPrefix: pathPrefix,
            content: btoa(md),
            editor_email: window.sessionStorage.getItem('username'),
            editor_pass: window.sessionStorage.getItem('password')
        });
    }

    /**
     * run mbake
     * @param id file name, eg: '/title.md'
     * @param md file content, eg: '###### Lorem ipsum dd dolor sit {.title}'
     * @param pathPrefix path to file, eg: 'blog/post-4'
     */
    build(id, md, pathPrefix) {
        return this.serviceRPC.invoke('/api/editors/post-build', 'put', {
            post_id: id,
            pathPrefix: pathPrefix,
            content: btoa(md),
            editor_email: window.sessionStorage.getItem('username'),
            editor_pass: window.sessionStorage.getItem('password')
        }).then(function(response) {
            return response;
        }).catch(function(error) {
            return error;
        });
    }

    /**
     * clone page
     * @param id new page folder name, eg: 'post-cpv'
     * @param pathPrefix path to file, eg: 'blog/post-4'
     */
    createPost(id, pathPrefix) {
        return this.serviceRPC.invoke('/api/editors/new-post', 'post', {
            post_id: id,
            pathPrefix: pathPrefix,
            editor_email: window.sessionStorage.getItem('username'),
            editor_pass: window.sessionStorage.getItem('password')
        });
    }

    /**
     * file upload
     * @param data FormData
     * @param pathPrefix path to file, eg: 'blog/post-4'
     */
    upload(data, pathPrefix) {
        return this.serviceRPC.invoke('/api/editors/upload', 'post', {
                pathPrefix: pathPrefix,
                editor_email: window.sessionStorage.getItem('username'),
                editor_pass: window.sessionStorage.getItem('password')
            }, data.get('sampleFile'))
            .then(function(response) {
                console.info(response);
            })
            .catch(function(error) {
                console.info(error);
            });
    }

    /**
     * set publishDate field to dat.yaml
     * @param publish_date epoch date format, eg: '1602288000'
     * @param pathPrefix post path file, eg: 'blog/post-4'
     */
    setPublishDate(publish_date, pathPrefix) {
        return this.serviceRPC.invoke('/api/editors/set-publish-date', 'put', {
            publish_date: publish_date,
            post_id: pathPrefix,
            editor_email: window.sessionStorage.getItem('username'),
            editor_pass: window.sessionStorage.getItem('password')
        });
    }

    /**
     * get mbake version
     */
    getMbakeVersion() {
        return this.serviceRPC
            .invoke('/api/editors/mbake-version', 'get', {
                editor_email: window.sessionStorage.getItem('username'),
                editor_pass: window.sessionStorage.getItem('password')
            })
            .then(function(response) {
                console.info('Base.js mbake version:', response);
            });
    }

}