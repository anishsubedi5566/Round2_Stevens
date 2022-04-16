const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { engine } = require('express-handlebars');

//Setting MonoDB
const mongodb = require('mongodb')
const  ObjectID = require('mongodb').ObjectId;
const { networkInterfaces } = require('os')
const static = express.static(__dirname + '/public');

const app = express()

//Use the middleware of bodyparser
app.use(bodyParser.urlencoded({extended:true}))

//Setting handlerbars for frontend view
app.engine('handlebars',engine({ defaultLayout: "main"}));
app.set('view engine', 'handlebars');

 
//Initialing multar library
var storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"uploads");
    },
    filename:function(req,file,cb){
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname) )
    }
    
})


var upload = multer({
    storage: storage
})


//configure mongodb
const MongoClient = mongodb.MongoClient;
const url = "mongodb+srv://admin:admin@cluster0.gkz3o.mongodb.net/new?retryWrites=true&w=majority"

MongoClient.connect(url,{
    useUnifiedTopology: true, useNewUrlParser: true
}, (err,client)=>{
    if(err) return console.log(err)

    db = client.db("new")

    app.listen(3000,()=>{
        console.log("Monogodb server is listening at 3000")
    })
})


//Creating rotes for server
app.post("/uploadanyfile",upload.single('myFile'),(req,res)=>{
    console.log("if no file", req.file)

    if(!req.file){
        res.render('detail/form',{
            message: "Please select a file to upload",
        })
        return
    }
   

    var file = fs.readFileSync(req.file.path);
    var encode_image = file.toString('base64');
    //def a JSON Obj
    var finalFile = {
        contentType: req.file.mimetype,
        path: req.file.path,
        image: new Buffer.from(encode_image,'base64')
    }

    //Insert the file to the database
    db.collection('file').insertOne(finalFile, (err, result)=>{
        if(err) return console.log(err);
        if(result.acknowledged){
            res.render('detail/form',{
                message: "File is Uploaded Successfully with Id",
                id: result.insertedId
            })
        }
        else{
            res.render('detail/form',{
                message: "Something went wrong"
            })
        }
        return 
    })
})

app.get("/allFiles",(req,res)=>{


    try {
        x = db.collection('file').find().toArray((err, result) => { 
            if(result.length < 1) {
                res.render('detail/form',{
                    userMessage: "There is not file in the database. Please upload first"
                })
                return
            }
            const fileArray= result.map(element => element._id);   
            if (err) return console.log(err)
            res.render('detail/idDisplay',{
                id: fileArray
            })
            })
    } catch (error) {
        res.render('detail/form',{  
            userMessage: error
        })
    }

    
})

app.get('/allFiles/:id', (req, res) => {
    var filename = req.params.id;   
        db.collection('file').findOne({'_id': ObjectID(filename) }, (err, result) => {
        if (err) return console.log(err)
            res.set({
                "Content-Type": result.contentType,
                "Content-Disposition": result.contentType
            });
            res.end(result.image.buffer);
            })
            })


app.post('/info', async(req,res)=>{
    const name = req.body.name
    const email = req.body.email
    const address = req.body.address
    try {

        if(!name) throw "Please input all 3 fields"
        if(!email) throw "Please input all 3 fields"
        if(!address) throw "Please input all 3 fields"

        var userInfo = {
            name: name,
            email: email,
            address: address
        }
        //Insert the use to the database
        let uploadedId
        db.collection('users').insertOne(userInfo, (err, result)=>{
            uploadedId = result
            if(err) return console.log(err);

            if(result.acknowledged){
                res.render('detail/form',{
                    userMessage: "User information is uploaded Successfully",
                })
                return
            }
            else{
                res.render('detail/form',{
                    userMessage: "Something went wrong"
                })
            }
        })   
        return
       
    } catch (error) {
        res.render('detail/form',{
            userMessage: error
        })
        return 
    }
})

app.get("/users",(req,res)=>{
    x = db.collection('users').find().toArray((err, result) => {
    if (err) return console.log(err)
    if(result.length < 1) {
        res.render('detail/form',{
            userMessage: "There is not user in the database. Please upload first"
        })
        return
    }
    res.render('detail/users',{
        user: result
    })
    return
   
    })
})


// Configure Routes
app.get('/',(req,res) =>{
    res.render('detail/form')
})


app.use('/public', static);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.listen(5000,() =>{
    console.timeLog("server is listening to 5000")
});