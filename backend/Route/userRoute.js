const express = require("express")
const router = express.Router()
const user = require("../Controller/userContorller")

router.get("/user",user.getAllusers)
router.post("/user",user.createUser)
router.put("/user/:id",user.updateUser)
router.delete("/user/:id", user.deleteUser)
router.get("/user/:id",user.findById)



module.exports = router