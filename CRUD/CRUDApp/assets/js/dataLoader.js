
window.global = {} // to store global data

depp.require(['polly'], onPoly)

depp.define({'CRUD':'/assets/models/CRUDViewModel.js'})

//load ViewModel
function onPoly() {
   depp.require('CRUD')
}
