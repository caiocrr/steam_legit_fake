var http = require('http');
var fs = require('fs');
var request = require('request');
var callback = "function (data) { document.write(data); document.close(); }" 
var content = "<button onclick=\"jQuery.get('http://localhost:8089/fake', " + callback + "); this.onclick=null;\" type='button' style='width: 100px; height: 50px; position:absolute; top:0; background-color: #FF0000; color: #FFFFFF'>É fake!</button><button onclick=\"jQuery.get('http://localhost:8089/next', " + callback + "); this.onclick=null;\"  type='button' style='width: 100px; height: 50px; position:absolute; top:0; right:50vw; z-index: 500'>Próximo</button><button onclick=\"jQuery.get('http://localhost:8089/confiavel', " + callback + "); this.onclick=null;\"  type='button' style='width: 100px; height: 50px; position:absolute; top:0; right:0; background-color:#00FF00'>Confiável</button></body></html>"

const fileName = "steamid_visitados.json"
const express = require('express')
const app = express()

var _idAtual = 0;
var _keys = [];
var idsNaoVisitados = []

var carregarIds = function (callback) {
    fs.readFile(fileName, function (err, data) {
        var json = JSON.parse(data)
        _keys = Object.keys(json)
        console.log('file loaded')
        var arr = Object.keys(json).map(function(k) { return {id:k, visitado: json[k].visitado}} );
        idsNaoVisitados = arr.filter(function(x) { return x.visitado == false}).map(function(x) {return x.id})
        _idsArquivo = json
        callback();
    });
}


var saveFile = function (callback) {
    fs.writeFile(fileName, JSON.stringify(_idsArquivo), function(err) {
        if(err) {
            return console.log(err);
        }
        callback();
    }); 
}
var recuperarProximoId = function (req,res,next) {
    var index = Math.floor(Math.random() * idsNaoVisitados.length)
    _idAtual = idsNaoVisitados[index]
    idsNaoVisitados.splice(index, 1);
    return _idAtual
}

var fake = function (req,res,next) {
    console.log("FAKE!!! ", _idAtual)
    _idsArquivo[_idAtual].visitado = true;
    _idsArquivo[_idAtual].fake = true;
    _idsArquivo[_idAtual].confiavel = false;
    saveFile(() => {
        recuperarProximoId();
        next();
    })
}

var confiavel = function (req,res,next) {
    console.log("Confiável! ", _idAtual)
    _idsArquivo[_idAtual].visitado = true;
    _idsArquivo[_idAtual].confiavel = true;
    _idsArquivo[_idAtual].fake = false;
    saveFile(() => {
        recuperarProximoId();
        next();
    })
}

var nextPage = function (req,res,next) {
    console.log("Nada a dizer ", _idAtual)
    _idsArquivo[_idAtual].visitado = true;
    _idsArquivo[_idAtual].fake = false;
    _idsArquivo[_idAtual].confiavel = false;
    saveFile(() => {
        recuperarProximoId();
        next();
    })
}

var paginaSteam = function () {
    return (req, res,next) => {
        request.get('https://steamcommunity.com/profiles/'+_idAtual, function(err, response, body) {
            console.log("requested " + _idAtual)
            body = body.slice(0, -16);
            body += content;
            res.send(body)
        });
    }
}

var init = function () {
    recuperarProximoId()

    app.get('/', paginaSteam())
    
    app.get('/fake', fake, paginaSteam())

    app.get('/confiavel', confiavel, paginaSteam())
    
    app.get('/next', nextPage, paginaSteam())
    
    app.listen(8089, () => console.log('Example app listening on port 8089 '))
}

carregarIds(init)