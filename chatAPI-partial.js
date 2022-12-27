const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile( __dirname + '/index.html');
});
server.listen(PORT, () => {
    console.log("Server Started. "+PORT);
});

const MongoClient= require('mongodb').MongoClient;
const url= "mongodb+srv://yesa:A8746z@cluster0.uiviw1n.mongodb.net/?retryWrites=true&w=majority";

let chatRecords = [];
io.on('connection', (socket) => {
    socket.on('chat', function(content){
        if (content.user != "" && content.say != ""){
            let obj = {
                user: content.user,
                say: content.say,
                time: new Date().toLocaleString()
            };
            chatRecords.push(obj);
            console.log(chatRecords);
        }
        socket.emit('chaton', chatRecords);
    });
    socket.on('clear', function(){
        chatRecords=[];
        socket.emit('clearon');
    });
    socket.on('save', function(){
        let chatid=[];
        for(let i=0;i<chatRecords.length;i++){
            if(!('_id' in chatRecords[i])){
                chatid.push(chatRecords[i]);
            }
        }
        if(chatid.length!=0){
            MongoClient.connect(url, function(err, db) {
                if(err) throw err;
                const dbo= db.db("chat");
                const options = { ordered: true };
                dbo.collection("msg").insertMany(chatid, options, function (err, res) {
                    if (err) throw err;
                    console.log(`multiple documents were inserted`);
                    socket.emit('saveon', chatRecords);
                    db.close();
                });
            });
        }
    });
    socket.on('reload', function(){
        MongoClient.connect(url, function(err, db) {
            if(err) throw err;
            const dbo= db.db("chat");
            dbo.collection("msg").find({}).toArray(function(err, result) {
                if (err) throw err;
                chatRecords = result;
                socket.emit('reloadon', chatRecords);
                db.close();
            });
        });
    });
});
