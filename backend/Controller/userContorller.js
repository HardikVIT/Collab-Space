const User = require("../Models/user")

exports.getAllusers = async (req,res) => {
    try{
        let users = await User.find({})
        res.send(users)
    }
    catch(err){
        res.status(500).send(err)
    }
}

exports.createUser = async (req,res) => {
    try{
        const user = new User(req.body)
        await user.save()
        res.status(201).send(user)
    }
    catch(err){
        res.status(500).send(err)
    }
}

exports.updateUser = async (req,res) => {
    try{
        const user = await User.findByIdAndUpdate(req.params.id, res.body)
        if(!user){
            return res.status(404).send("user not found")
        }
        res.send(user)
    }
    catch(err){
        res.status(500).send(err)
    }
}

exports.deleteUser = async (req,res) => {
    try{
        const user = await User.findByIdAndDelete(req.params.id)
        if(!user){
            return res.status(404).send("user not found")
        }
        res.send(user)
    }
    catch(err){
        res.status(500).send(err)
    }
}

exports.deleteUser = async (req,res) => {
    try{
        const user = await User.findByIdAndDelete(req.params.id)
        if(!user){
            return res.status(404).send("user not found")
        }
        res.send(user)
    }
    catch(err){
        res.status(500).send(err)
    }
}

exports.findById = async (req,res) => {
    try{
        const user = await User.findById(req.params.id)
        if(!user){
            return res.status(404).send("user not found")
        }
        res.send(user)
    }
    catch(err){
        res.status(500).send(err)
    }
}
