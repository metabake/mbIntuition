
// Copyright and all rights reserved for Metabake.net | Cekvenich, licensed under LGPL 2.1

export class Ver {
   ver() {
      return 'v4.14.4'
   }
}

// metaMD
import markdownItAttrs = require('markdown-it-attrs')
const md = require('markdown-it')({
   html: true,
   typographer: true,
   breaks: true
})
md.use(markdownItAttrs)

import Marpit = require('@marp-team/marpit')
const marpit = new Marpit.Marpit()


import fs = require('fs')
import FileHound = require('filehound')
import yaml = require('js-yaml')

import riotc = require('riot-compiler')
import pug = require('pug')
const minify = require('html-minifier').minify
const Terser = require("terser")

const logger = require('tracer').console()

import csv2JsonV2 = require('csvtojson')

import * as JavaScriptObfuscator from 'javascript-obfuscator'

// map
import sm = require('sitemap')
import traverse = require('traverse')
import lunr = require('lunr')

import { TInputOptions } from "javascript-obfuscator/src/types/options/TInputOptions"

// code /////////////////////////////////////////////////////////////////////////////////////////////////
export class RetMsg {
   _cmd:string
   _code:number
   _msg: any
   constructor(cmd:string, code:number, msg:any) {
      this._cmd = cmd
      this._code = code
      this._msg = msg
   }//)_
   get cmd():string {
      return this.cmd
   }
   get code():number {
      return Math.round(this._code)
   }
   get msg():any{
      return this
   }
   log() {
      console.log(this.cmd, this.msg, this.code)
   }
}//class

export class Dirs {
   dir:string
   constructor(dir_:string) {
      let dir = Dirs.slash(dir_)
      this.dir=dir
   }
   static slash(path) {// windowze
      return path.replace(/\\/g, '/')
   }
   getInDir(sub) {
      const rec = FileHound.create() //recurse
         .paths(this.dir+sub)
         .not().glob("*.js")
         .findSync()

      let ret : string[] = [] //empty string array
      const ll = this.dir.length +sub.length
      for (let s of rec) {//clean the strings
         //console.log(s)
         let n = s.substr(ll)
         //console.log(n)
         if(n.includes('index.html')) continue
         if(n.includes('index.pug')) continue

         ret.push(n)
      }
      return ret
   }

   /**
    * Get list of dirs w/o root part
    */
   getShort() {
      let lst = this.get()
      let ret : string[] = [] //empty string array
      const ll = this.dir.length
      logger.trace(this.dir,ll)

      for (let s of lst) {//clean the strings
         //console.log(s)
         let n = s.substr(ll)
         //console.log(n)
         ret.push(n)
      }
      return ret
   }

   get() {
      logger.trace(this.dir)
      const rec = FileHound.create() //recurse
         .paths(this.dir)
         .ext('yaml')
         .findSync()
      let ret : string[] = [] //empty string array
      for (let val of rec) {//clean the strings
         val = Dirs.slash(val)
         let n = val.lastIndexOf('/')
         let s:string = val.substring(0,n)
         if (!fs.existsSync(s+'/dat.yaml'))
            continue
         ret.push(s)
      }
      //logger.trace(ret)
      return ret
   }//()
}//class

export class Dat {
   props: any
   path:string
   constructor(path_:string) {
      let path = Dirs.slash(path_)
      //logger.trace(path)
      this.path = path

      let y
      if (fs.existsSync(path+'/dat.yaml'))
         y = yaml.load(fs.readFileSync(path+'/dat.yaml'))
      if(!y) y= {}
      this.props = y

      let keys = Object.keys( y )
      if(keys.includes('include')) this._addData()
   }
   write() {
      try{
         let y = yaml.dump(this.props,{
            skipInvalid : true,
            noRefs: true,
            noCompatMode: true,
            condenseFlow: true
         })
         let p = this.path+'/dat.yaml'
         logger.trace(p)
         fs.writeFileSync(p, y)
      } catch(err) { logger.info(err)}
   }
   set(key, val) { // ex: 'title', 'My First Blog'
      this.props[key] = val
   }
   _addData() {
      let jn = this.props.include
      let fn = this.path+'/'+jn
      logger.trace( fn)
      let jso = fs.readFileSync(fn)
      Object.assign(this.props, JSON.parse(jso.toString())) // merge
   }

   getAll():Object {
      return this.props
   }//()
}//class


export class CSV2Json { // TODO: get to work with watcher
   dir:string
   constructor(dir_:string) {
      if(!dir_ || dir_.length < 1) {
         console.log('no path arg passed')
         return
      }
      this.dir = Dirs.slash(dir_)
   }

   convert():RetMsg {

      let fn:string = this.dir +'/list.csv'
      if (!fs.existsSync(fn)) { //if it does not exist, go up a level
         let r = new RetMsg('CSV2Json', -1, 'list.csv not found in ' + this.dir)
         console.log('not found', r)
         return r
      }
      let r = new RetMsg('CSV2Json', 1, 'OK')
      let thiz = this
      logger.trace('1')

      csv2JsonV2({ noheader:true }).fromFile(fn)
         .then(function(jsonO) {
            logger.trace(jsonO)
            let fj:string = thiz.dir +'/list.json'

            fs.writeFileSync(fj, JSON.stringify(jsonO, null, 3))
            return r
         })

   }//()
}


export class Map {
   _sitemap
   _root
   constructor(root) {
      if(!root || root.length < 1) {
         console.log('no path arg passed')
         return
      }
      this._root = root
   }
   gen():RetMsg {
      const m = yaml.load(fs.readFileSync(this._root+'/map.yaml'))
      let jmenu = JSON.stringify(m.menu, null, 2)
      //menu done
      fs.writeFileSync(this._root+'/menu.json', jmenu)

      this._sitemap = sm.createSitemap( {
         hostname: m['host']
      })

      //build sitemap
      let leaves = traverse(m.menu).reduce(function (acc, x) {
         if (this.isLeaf) acc.push(x)
         return acc
      }, [])
      // any items recursively
      let itemsRoot = m['itemsRoot']
      if (itemsRoot) {
         //visit each path
         const d = new Dirs(this._root + itemsRoot)
         leaves = leaves.concat(d.get())
      }

      let arrayLength = leaves.length
      logger.trace(arrayLength)
      for (let i = 0; i < arrayLength; i++) {
         try {
            let path = leaves[i]

            if(path.includes(this._root))
               path = path.replace(this._root,'')
            let fullPath =  this._root + path

            let dat = new Dat(fullPath)
            let props = dat.getAll()
            logger.trace(path)//, props)

            //priority
            let priority = props['priority']
            if(!priority) priority = 0.3

            let image = props['image']
            if(!image) {
               this._sitemap.add({
                  url: path,
                  changefreq: m['changefreq'],
                  priority: priority
               })
            } else {  //if it has image
               this._sitemap.add({
                  url: path,
                  changefreq: m['changefreq'],
                  priority: priority,
                  img: [{
                     url: image,
                     title: props['title'],
                     caption: props['title']
                  }]
               })
            }
         } catch(err) { logger.trace(err)}
      }//for

      //validate and write
      const thiz = this
      this._sitemap.toXML( function (err, xml) {

         fs.writeFileSync(thiz._root+'/sitemap.xml', xml)
         console.log(' Sitemap ready')

         thiz._map(leaves)

      })// to XML write
      return new RetMsg(thiz._root + ' map', 1,'ok')
   }//map()

   _map(leaves) {
      let documents = []

      let arrayLength = leaves.length
      for (let i = 0; i < arrayLength; i++) {
         try {
            let path = leaves[i]
            if(path.includes(this._root))
               path = path.replace(this._root,'')
            let fullPath =  this._root + path

            // find all md files in fullPath
            const rec = FileHound.create() //recurse
               .paths(fullPath)
               .ext('md')
               .findSync()

            let text =''
            for (let val of rec) {//clean the strings
               val = Dirs.slash(val)
               console.log(val)
               let txt1 = fs.readFileSync(val, "utf8")
               text = text + ' ' + txt1
            }//for
            const row = {
               id: path,
               body: text
            }
            documents.push(row)
         } catch(err) { logger.trace(err)}
      }//for

      //fts index
      logger.trace(documents.length)
      let idx = lunr(function () {
         this.ref('id')
         this.field('body')

         documents.forEach(function (doc) {
            this.add(doc)
         }, this)
      })//idx

      const jidx = JSON.stringify(idx)
      fs.writeFileSync(this._root+'/FTS.idx', jidx)

      console.log(' Map generated menu.json, sitemap.xml and FTS.idx(json) index in '+ this._root)

   }//()
}// class


export class MBake {

   bake(path):RetMsg {
      if(!path || path.length < 1) {
         console.log('no path arg passed')
         return
      }
      try {
         console.log(' Baking ' + path)

         let d = new Dirs(path)
         let dirs =d.get()

         for (let val of dirs) {
            let n = new BakeWrk(val)
            n.bake()
         }
      } catch(err) {
         logger.trace(err)
         return new RetMsg(path + ' bake', -1, err)
      }
      return new RetMsg(path + ' bake', 1, 'ok')
   }

   tag(path):RetMsg {
      if(!path || path.length < 1) {
         console.log('no path arg passed')
         return
      }
      try {
         console.log(' Tag ' + path)

         let t = new Tag(path)
         let lst = t.get()
         t.tag(lst)

         // now do the regular bake
         return this.bake(path)
      } catch(err) {
         //logger.trace(err)
         return new RetMsg(path + ' tag', -1, err)
      }
      // return new RetMsg(path + ' tag', 1,'ok')
   }

   itemizeOnly(path):RetMsg {

      console.log(' Itemize ' + path)
      try {
         const i = new Items(path)
         i.itemize()
      } catch(err) {
         logger.trace(err)
         return new RetMsg(path + ' itemize',  -1, err)
      }
      return new RetMsg(path + ' itemize', 1,'ok')
   }

   // itemize and bake
   itemizeNBake(ppath):RetMsg {
      if(!ppath || ppath.length < 1) {
         console.log('no path arg passed')
         return
      }
      logger.trace('ib:', ppath)

      try {
         const i = new Items(ppath)
         i.itemize()
      } catch(err) {
         logger.trace(err)
         return new RetMsg(ppath + ' itemizeB', -1, err)
      }
      return this.bake(ppath)
   }

   // itemize, bake and tag, needs itemize to find yaml i dat in path
   _all(path):RetMsg {
      try {
         let t = new Tag(path)
         let lst = t.get()
         t.tag(lst)
         return this.itemizeOnly(path)
      } catch(err) {
         logger.trace(err)
         return new RetMsg(path + ' tagA', -1, err)
      }
      // return new RetMsg(path + ' tagA', 1,'ok')
   }
}


export class BakeWrk {
   dir:string
   static ebodyHtml = '</body>'

   constructor(dir_:string) {
      let dir = Dirs.slash(dir_)

      this.dir=dir
      console.log(' processing: '+ this.dir)
   }


   static metaMD(text, options) {//a custom md filter that uses a transformer
      console.log(' ',options)
      return md.render(text)
   }

   static marp(text, options) {//a custom md filter that uses a transformer
      console.log(' ',options)
      const { html, css } = marpit.render(text)
      return html
   }

   //https://github.com/kangax/html-minifier/issues/843
   static minify_es6(text, inline) {
      var uglifyEsOptions = { parse: { bare_returns: {}},
         mangle: false,
         keep_classnames: true,
         keep_fnames: true,
         safari10: true
      }

      var code = text.match(/^\s*\s*$/) ? '' : text
      uglifyEsOptions.parse.bare_returns = inline

      var result = Terser.minify(code, uglifyEsOptions)
      if (result.error) {
      console.log('Uglify-es error:', result.error)
      return text
      }
      return result.code.replace(/;$/, '')
   }

   bake() {
      process.chdir(this.dir)

      if (!fs.existsSync(this.dir+'/index.pug'))
         return ' '

      let m = new Dat(this.dir)
      //static data binding with a custom md filter that uses a transformer
      let options = m.getAll() 
      options['filters'] = {
         metaMD: BakeWrk.metaMD,
         marp: BakeWrk.marp
      } 
      let minifyO = {
         caseSensitive: true,
         collapseWhitespace: true,
         decodeEntities: true,
         minifyCSS: true,
         minifyJS: BakeWrk.minify_es6,
         quoteCharacter: "'",
         removeComments: true,
         removeScriptTypeAttributes: true,
         removeStyleLinkTypeAttributes: true,
         useShortDoctype: true,
         sortAttributes: true,
         sortClassName: true
      }
      let html = pug.renderFile(this.dir+'/index.pug',options )

      const ver = '<!-- mB ' + new Ver().ver() +' on '+new Date().toISOString()+' -->'
      if(!options['pretty'])
         html = minify(html, minifyO)
      html = html.replace(BakeWrk.ebodyHtml, ver+BakeWrk.ebodyHtml)

      let fn = this.dir + '/index.html'
      fs.writeFileSync(fn, html)
      //console.log(' processed: '+ this.dir)

      //amp
      if (!fs.existsSync(this.dir+'/m.pug'))
        return ' '
      //static data binding:
      html = pug.renderFile(this.dir+'/m.pug', options )

      if(!options['pretty'])
         html = minify(html, minifyO)
      html = html.replace(BakeWrk.ebodyHtml, ver+BakeWrk.ebodyHtml)

      fn = this.dir + '/m.html'
      fs.writeFileSync(fn, html)

   }//()

   getNameFromFileName(filename) {//lifted from pug cli
      filename =  Dirs.slash(filename)

      if (filename.indexOf('/')>-1) {
         let pos = filename.lastIndexOf('/')+1
         filename = filename.substring(pos)
      }
      let file = filename.replace(/\.(?:pug|jade)$/, '')
      return file.toLowerCase().replace(/[^a-z0-9]+([a-z])/g, function (_, character) {
        return character.toUpperCase()
      }) + 'Bind'
    }
}//class


export class Items {
   dir:string
   dirs // array
   feed //rss
   constructor(dir_:string) {
      let dir = Dirs.slash(dir_)

      let fn:string = dir +'/dat_i.yaml'
      if (!fs.existsSync(fn)) { //if it does not exist, go up a level
         let n = dir.lastIndexOf('/')
         if(n<0) throw new Error('no dat_i.yaml at ' + dir)
         dir = dir.substring(0,n)
      }

      logger.trace(' IB :', dir)

      fn = dir +'/dat_i.yaml'
      if (!fs.existsSync(fn))
        throw new Error('no dat_i.yaml at ' + dir)

      this.dir=dir
      let d = new Dirs(dir)
      this.dirs =d.get()
   }

   _addAnItem(dn) {
      try {
         if ( !fs.existsSync( dn+'/dat.yaml') )
            return
         let y = yaml.load(fs.readFileSync(dn+'/dat.yaml'))
         if(!y) return

         Items.clean(y)

         let dl = dn.lastIndexOf('/')

         let url = dn.substring(dl+1)
         console.log('',url)
         y.url = url

         //array of items
            if(!this.feed.items)
               this.feed.items =[]

            y.index =  this.feed.items.length
            //console.log('', this.feed.items.length)

            this.feed.items.push(y)

      } catch(err) {
         logger.trace(err)
      }
   }

   itemize():string {
      logger.trace('Itemizing: '+ this.dir)

      const rootDir:string = this.dir
      // header
      let fn:string = rootDir +'/dat_i.yaml'
      let y = yaml.load(fs.readFileSync((fn)))

      Items.clean(y)
      y.nbVer = new Ver().ver()
      y.note = 'This is statically served and visible publicly.'
      this.feed = y

      for (let val of this.dirs) {
         this._addAnItem(val)
      }

      if(!this.feed.items.length)  {
         logger.trace('no items')
         return
      }
      this.feed.count =  this.feed.items.length

      //write
      let json = JSON.stringify(this.feed, null, 2)
      let items = rootDir + '/items.json'
      fs.writeFileSync(items, json)

      console.log(' processed.')
      return ' processed '
   }

   static clean(o:Object) {// remove fields that are pug
      delete o['basedir']
      delete o['ROOT']
      delete o['pretty']

      delete o['publishOn']

   }

}//class

export class Tag {
   dir:string

   constructor(dir_:string) {
      let dir = Dirs.slash(dir_)

      this.dir=dir
   }

   get() {
      const rec = FileHound.create() //recurse
         .paths(this.dir)
         .ext('pug')
         .glob('*-tag.pug')
         .findSync()
      let ret : string[] = [] //empty string array
      for (let val of rec) {//clean the strings
         val = val.split('\\').join('/') // windoze
         ret.push(val)
      }
      return ret
   }//()
   tag(list):string {
      console.log('Looking for tags *-tag '+ this.dir)
      for (let val of list) {//clean the strings
         let s:string =  fs.readFileSync(val).toString()

         let n = val.lastIndexOf('/')
         let dir:string = val.substring(0,n)
         let name:string = val.substring(n)
         let p = name.lastIndexOf('.')
         name = name.substring(0,p)
         console.log(' '+ dir+name)
         this.process(s,dir+name)
      }
      return 'ok'
   }//()

   static getObsOptions ():TInputOptions { 
      let t = {
      identifierNamesGenerator: 'mangled' // for virus
      , disableConsoleOutput: false

      , stringArray: true
      , stringArrayThreshold: 1
      , stringArrayEncoding: 'rc4'

      , selfDefending: true

      , controlFlowFlattening: true
      , controlFlowFlatteningThreshold: 1

      , deadCodeInjection: true
      , deadCodeInjectionThreshold: 0.2
    }
    return t as TInputOptions
   }

   process(s:string, fn:string) {
      const r_options = {'template':'pug'}

      logger.trace('compiling',fn+'.tag')
      let js
      try {
      js = riotc.compile(s, r_options)
      } catch(err) {
         logger.error('compiler error')
         logger.error(err)
         return
      }

      fs.writeFileSync(fn+'.js', js)

      logger.trace('minify')

      let ugs
      try {
         // ugs http://npmjs.com/package/uglify-es
         ugs = JavaScriptObfuscator.obfuscate(js, Tag.getObsOptions())// ugs

      } catch(err) {
         logger.error('error')
         logger.error(err)
         return
      }

      fs.writeFileSync(fn+'.min.js', ugs.getObfuscatedCode())
   }
}//class


module.exports = {
   Dat, Dirs, BakeWrk, Items, Tag, Ver, MBake, RetMsg, 
   CSV2Json, Map
}
