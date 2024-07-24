const express = require('express')
const Joi = require('joi')
const cors = require('cors')
const { connectToDb, getDb } = require('./db')
const { ObjectId } = require('mongodb')
const app = express()
app.use(express.json())
const generalTexts = require('./fixture/general_text')
let db

connectToDb((err) => {
  if (!err) {
    const port = process.env.PORT || 3001
    app.listen(port, () => console.log(`Listening on port ${port}`))
    db = getDb()
  }
})
// const port = process.env.PORT || 3001
// app.listen(port, () => console.log(`Listening on port ${port}`))

app.use(cors())





//insert user
app.post('/api/user/insert', (req, res) => {
  let err = { error: 'the value of the fields equal to 1 are taken', emailCheck: 0, nickCheck: 0 }
  const reqUser = req.body
  const nickname = reqUser.nickname
  const email = reqUser.email
  const usersDB = db.collection('users')

  usersDB
    .find()
    .forEach((user) => {
      console.log('User', user)
      if (user.nickname === nickname) {
        err.nickCheck = 1
      }
      if (user.email === email) {
        err.emailCheck = 1
      }
    })
    .then(() => {
      if (err.emailCheck === 1 || err.nickCheck === 1) {
        res.status(404).json(err)
      } else {
        usersDB.insertOne(reqUser)
        res.status(200).json(reqUser)
      }
    })
    .catch(() => {
      res.status(500).json({ error: "Couldn't onnect to DB" })
    })
})



//user deletion
// 6697d55e5bc67c001a0c738c
app.delete('/api/user/:id/delete', (req, res) => {
  let err = { error: 'user does not exist' }
  const userID = req.params.id
  const usersDB = db.collection('users')

  usersDB.deleteOne({ _id: new ObjectId(userID)})
    .then(()=>{
      res.status(200).json({message:'User Removed Successfully'})
    })
    .catch(() => {
      res.status(404).json(err)
    })
})


//update user
app.post('/api/user/:id/update', (req, res) => {  
  const userID = req.params.id
  const usersDB = db.collection('users')

  usersDB.updateOne(
    {_id:new ObjectId(userID)},
    {$set:req.body}
  )
  .then(()=>{
    res.status(200).json({message:'User Updated Successfully'})
  })
  .catch(() => {
    res.status(404).json({ error: "Update Failed" })
  })
})

//user login
app.get('/api/login', (req, res) => {
  //{email: #####,pass:#######}/{nickname: #####,pass:#######}
  const {email,nickname,password}=req.query
  let filter = { password };
    if (email) filter.email = email;
    if (nickname) filter.nickname = nickname;
  const usersDB = db.collection('users')

  usersDB.findOne(filter)
  .then((user)=>{
    res.status(200).json({userid:user._id.toString(),message:"login successful"})
  })
  .catch(() => {
    res.status(404).json({ error: "Login Failed" })

  })
})

app.get('/api/about', (req, res) => {
  res.json({ aboutText: generalTexts.aboutTxt })
})
app.get('/api/ping', (req, res) => {
  res.json(['pong I LOVE U 7'])
})








//  Original
// app.post('/api/user', (req, res) => {
//   let errorList = { errors: [] }
//   const reqUser = req.body
//   const nickname = reqUser.nickname
//   const email = reqUser.email
//   const usersDB = db.collection('users')

//   usersDB
//     .find()
//     .forEach((user) => {
//       console.log('User', user)
//       if (user.nickname === nickname) {
//         errorList.errors.push({ message: 'Nickname is taken', field: 'nickname' })
//       }
//       if (user.email === email) {
//         errorList.errors.push({ message: 'Email is taken', field: 'email' })
//       }
//     })
//     .then(() => {
//       if (errorList.errors.length > 0) {
//         res.status(404).json(errorList)
//       } else {
//         usersDB.insertOne(reqUser)
//         res.status(200).json(reqUser)
//       }
//     })
//     .catch(() => {
//       res.status(500).json({ error: "Couldn't connect to DB" })
//     })
// })
