var responces = [];
depp.define({
    'scripts': [
        '#jquery', '#tabulator', '#gridformsJS'
        , '/admin/assets/css/spectreBottom.css'
    ],
    'httpRPC': ['#RPC'],
    // 'intuAPI': [
        // '#scripts','#httpRPC'
        // ,'/intuAPI/IntuAPI.js'
    // ],
    'baseVm': ['/admin/models/BaseViewModel.js'],
    'general': [
        '#baseVm'
        // , '#intuAPI'
        , '/admin/admin/bindEditors.js'
        // , '/admin/models/AdminViewModel.js'
    ],
    'rw': [
        '#general'
        , '#baseVm'
        // ,'/admin/bindLogin.js'
        // , '/admin/models/LoginViewModel.js'
        ,'/admin/assets/js/ui.js'
    ],
    'setup-page': [
        // '#intuAPI'
        ,'#baseVm'
        , '/admin/settings/settings-comp.js'
        // , '/admin/settings/BindSettings.js'
        , '/admin/models/SettingsViewModel.js'
    ],
    'fonts': [
        '#crud'
        , 'css!//fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i'
    ]
});

depp.require(['fonts']);