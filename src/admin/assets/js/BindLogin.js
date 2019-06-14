/**
    Admin login
**/
class BindLogin {
    constructor() {
        this.WebAdmin = new WebAdmin()
    }
    login(email, pass) {
        this.WebAdmin.checkAdmin(email, pass)
            .then(function(result) {
                console.info("--result:", result)
                if (result) {
                    window.sessionStorage.setItem('username', email);
                    window.sessionStorage.setItem('password', pass);

                    window.location = '/admin/settings';
                } else {
                    window.location = '/admin'
                }
            })
    }
    signOut() {
        sessionStorage.removeItem('username');
        console.info("--sessionStorage:", sessionStorage)
        sessionStorage.removeItem('password');
        if (window.location.pathname !== '' && window.location.pathname !== '/admin') {
            window.location.replace('/admin');
        }
    }

    sendVcode(email) {
        if (email !== '') {
            this.WebAdmin.sendVcode(email)
                .then(function(result) {
                    console.info("--result:", result)
                })
        }
    }

    resetPass(email, code, pass) {
        if (email !== '' && pass !== '' && code !== '') {
            this.WebAdmin.resetPass(email, code, pass)
                .then(function(result) {
                    if (result) {
                        alert("Password changed")
                    } else {
                        alert("Error")
                    }
                    console.info("--result:", result)
                })
        }
    }
}