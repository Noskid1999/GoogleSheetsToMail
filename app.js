const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const parser = require('body-parser');
const nodemailer = require('nodemailer');
const express = require('express');

//get authentication requirements for mailer
var myAuth=require('./my_auth');

const transporter = nodemailer.createTransport({
    service:'gmail',
    auth: {
        user: myAuth.email,
        pass: myAuth.password
    }
});

const app = express();

app.set('views',__dirname+'/public/views')
app.use(express.static(__dirname+'/public'))//For serving the static files like css and js
app.set('view engine', 'pug');//use pug template


app.get('/', (req, res) => {
    //pass JSON object to the HTML file
    var userObjectJSON=JSON.stringify(userObjectArray);
    console.log(userObjectJSON);
    // Check for data found from the sheet and send data only if data found
    if(userObjectArray.length===0){
        res.send('<p>No data found. Please refresh or check the data list.</p>');
    }else{
        res.render('./result', {
            title:'Hello World',
            tableData: userObjectJSON
        });
    }   
})



const credentials = require('./client_secret.json');
//Create an array for storing user information
var userObjectArray = [];
var everyoneEmail=[];

async function access() {
    // For user credentials
    const doc = new GoogleSpreadsheet('1ZU9GUAT4wwBsqZfbF_NOHp9CtnE3AW8wMNuTDq2bhBg');
    await promisify(doc.useServiceAccountAuth)(credentials);

    // For document and sheet information
    const info = await promisify(doc.getInfo)();
    const sheet = info.worksheets[0];

    // For rows information
    const rows = await promisify(sheet.getRows)({
        offset: 1
    });

    // Get each rows and add to the userObjectArray
    rows.forEach(row => {
        var userObj = { name: row.name, email: row.email };
        userObjectArray.push(userObj);
        everyoneEmail.push(row.email);
    });
}
app.use(parser.urlencoded({extended:true}));//for the POST request parsing
app.post('/sendemail',(req,res)=>{
    var mailList=req.body.receiverEmail;
    var mailOptions={
        from: 'Dikson <sender@gmail.com>', // sender address
        subject: req.body.subject, // Subject line
        text: req.body.message, // plain text body
    }
    // check if mail is for everyone or from the form list
    if(mailList!='Everyone'){    
        mailOptions.to=mailList;
    }else{
        mailOptions.to=everyoneEmail;
    }
    // console.log(mailList)
    transporter.sendMail(mailOptions, function (err,info) {
        if(err){
            console.log("error sending mail");
            return;
        }else{
            console.log("Success: "+ info.messageId);
            console.log("preview: "+ nodemailer.getTestMessageUrl(info));
        }
        res.send('Ok');
    });
    
})
const server = app.listen(7000, () => {
    access();
    console.log(`Express running - PORT ${server.address().port}`);
});
