const PORT = 10000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { type } = require("os");
const { request } = require("http");
const { error } = require("console");


app.use(express.json()); //response will auto pass thorugh json
app.use(cors()); //react will connect using on the prot

app.use(
      cors({
          origin : "http://localhost:3000"
      })
)
const Users=mongoose.model('Users',{
      name:{
            type:String
      },
      password:{
            type:String
      },
      email:{
            type:String
      },
      cartData:{
            type:Object
      },
      date:{
            type:Date
      }

})
app.post('/signup',async (req,res)=>{
      let check=await Users.findOne({email:req.body.email});
      if(check){
            return res.status(400).json({success:false,errors:"existing users found with same username"})
      }
      let cart ={};
      for(let i=0;i<300;i++){
            cart[i]=0
      }
      const user=new Users({
      name:req.body.username,
      email:req.body.email,
      password:req.body.password,
      cartData:cart,
})
await user.save();
const data={
      user:{
            id:user.id
      }
}
const token=jwt.sign(data,'secret-ecom');
res.json({success:true,token})
})


app.post('/login',async (req,res)=>{
let user=await Users.findOne({email:req.body.email});
if(user){
      const passCompare=req.body.password===user.password;
      if(passCompare){
            const data={
                  user :{
                        id:user.id
                  }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
      }
      else{
            res.json({success:false,errors:"Wrong password"})
      }
}
else{
      res.json({success:false,errors:"Wrong email id"})
}

})


//Database connectio with mongo DB
mongoose.connect("mongodb+srv://aarshjain2022:aarshjain@cluster0.grnmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

  




app.listen(PORT,() => {
      try {
            console.log(`Connected to database at PORT : ${PORT}`)
      } catch (err) {
            console.error(`Error connecting to database, Error : ${err}`)
      }
})
