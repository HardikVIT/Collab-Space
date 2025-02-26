// all the files for schema will be inside this foler conventionally
// a general schema edit according to you need
const mongoose = require("mongoose")

const userSCHEMA = new mongoose.Schema({
    name : String,
    age : Number
})

const User = mongoose.model("user_details",userSCHEMA)

module.exports = User
