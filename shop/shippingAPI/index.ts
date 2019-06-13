import { ExpressRPC } from 'mbake/lib/Serv';


var request = require('request');
const yaml = require('js-yaml');
const fs = require('fs');

let config = yaml.load(fs.readFileSync('config.yaml'))[process.env.NODE_ENV || 'local'];

const app = ExpressRPC.makeInstance(config.cors);

const port = 9081

app.post('/printful-rate', function (req, res) {
   console.info("1)-------printful-rate req:", req.fields)

   const method = req.fields.mode
   // const params = JSON.parse(req.fields)
   const params = req.fields

   const resp: any = {} // new response
   let shippingAddress = params.content['shippingAddress']
   console.info("--shippingAddress:", shippingAddress)
   let items_g = params.content['items']
   console.log("TCL: params", params)

   let temp_shipping = {}
   temp_shipping['name'] = shippingAddress.fullName
   temp_shipping['address1'] = shippingAddress.address1
   temp_shipping['city'] = shippingAddress.city
   temp_shipping['country_code'] = shippingAddress.country
   temp_shipping['state_code'] = shippingAddress.province
   temp_shipping['zip'] = shippingAddress.postalCode

   let elements = []

   items_g.map(function (item) {
      let temp = {}
      temp['quantity'] = item.quantity
      temp['variant_id'] = item.id
      elements.push(temp)
   })

   let send_order = Object.assign({ recipient: temp_shipping, items: elements })
   console.info("--send_order:", send_order)
   if ('Test' == method) {
      // console.info("--shippingAddress:", shippingAddress.address1)

      resp.type = ''//eg array
      resp.ispacked = false
      console.log(resp)
      request({
         url: "https://api.printful.com/shipping/rates",
         headers: {
            'Authorization': 'Basic ' + config.apiKey,
         },
         method: 'POST',
         json: send_order

      }, function (error, response, body) {
         // console.info("--response:", response)
         console.info("--body printify-rate:", body)
         var shippin_rates = {
            "rates": [{
               "cost": 1,
               "description": "1$ shipping"
            }
            ]
         }
         res.json(shippin_rates); //res is the response object, and it passes info back to client-side
      });
      // res.json(resp)
   } else {
      resp.errorLevel = -1
      resp.errorMessage = 'mismatch'
      console.log(resp)
      res.json(resp)
   }

});


/*
* webhook called once the order have been placed and paind with snipcart 
*
*/
app.post('/printful-create-order', (req, res) => {
   console.info("2)-----printful-create-order:")
   const user = req.fields.user
   const pswd = req.fields.pswd // just changed from pswdH

   // const method = req.fields.method
   const mode = req.fields.mode
   const params = req.fields

   const resp: any = {} // new response
   if ('Test' == mode && params.eventName == 'order.completed') {

      resp.type = ''//eg array
      resp.ispacked = false

      let shippingAddress = params.content['shippingAddress']
      console.log("TCL: params", params)
      let items_g = params.content['items']

      let temp_shipping = {}
      temp_shipping['name'] = shippingAddress.fullName
      temp_shipping['address1'] = shippingAddress.address1
      temp_shipping['city'] = shippingAddress.city
      temp_shipping['country_code'] = shippingAddress.country
      temp_shipping['state_code'] = shippingAddress.province
      temp_shipping['zip'] = shippingAddress.postalCode

      let elements = []

      items_g.map(function (item) {
         let temp = {}
         temp['quantity'] = item.quantity
         temp['sync_variant_id'] = item.metadata.sync_variant_id
         elements.push(temp)
      })

      let send_order = Object.assign({ recipient: temp_shipping, items: elements })
      console.info("--send_order:", send_order)


      console.log(resp)

      request({
         url: "https://api.printful.com/orders",
         headers: {
            'Authorization': 'Basic ' + config.apiKey,
         },
         method: 'POST',
         json: send_order
      }, function (error, response, body) {
         console.info("--body:", body)
         res.json(body); //res is the response object, and it passes info back to client-side
      });
      // res.json(resp)
   } else {
      resp.errorLevel = -1
      resp.errorMessage = 'mismatch'
      console.log(resp)
      res.json(resp)
   }
   console.info()
})


app.listen(port, () => console.log(`ShopApi app listening on port ${port}!`))