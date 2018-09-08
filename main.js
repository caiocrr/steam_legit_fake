var http = require('http');
var fs = require('fs');
var request = require('request');
var callback = "function (data) { document.write(data); document.close(); }" 
var content = "<button onclick=\"jQuery.get('http://localhost:8089/fake', " + callback + ")\" type='button' style='position:absolute; top:0; background-color: #FF0000; color: #FFFFFF'>É fake!</button><button onclick=\"jQuery.get('http://localhost:8089/next', " + callback + ")\"  type='button' style='position:absolute; top:0; right:0 '>Próximo</button></body></html>"


const express = require('express')
const app = express()

var _idAtual = 0;
var _keys = [];

var carregarIds = function (callback) {
    fs.readFile('steamid_visitados.json', function (err, data) {
        var json = JSON.parse(data)
        _keys = Object.keys(json)
        console.log('file loaded')
        callback();
        return json;
    });
}
var recuperarProximoId = function (req,res,next) {
    var pos = _keys.indexOf(_idAtual);
    if (pos == -1 ) {
        _idAtual = _keys[0]
    }
    if (pos + 1 == _keys.length){
        console.log("Terminou")
    }
    _idAtual = _keys[pos+1]
    return _idAtual
}

var fake = function (req,res,next) {
    console.log("FAKE!!! ", _idAtual)
    recuperarProximoId();
    next();
}

var nextPage = function (req,res,next) {
    console.log("LEGIT!!! ", _idAtual)
    recuperarProximoId();
    next();
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
    
    app.get('/next', nextPage, paginaSteam())
    
    app.listen(8089, () => console.log('Example app listening on port 8089 '))
}

var _idsArquivo = carregarIds(init)
