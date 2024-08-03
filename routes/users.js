const express = require('express')
const { ObjectId } = require('mongodb')
const router = express.Router()
const general = require('../fixture/general_text')
const multer = require('multer')

const upload = multer({ storage: multer.memoryStorage() })

module.exports = (db) => {
  const defaultAvatar =
    'https://firebasestorage.googleapis.com/v0/b/gamegrid-f4689.appspot.com/o/files%2FHi6ytdtPudm74vacZe9mAi-1200-80-removebg-preview.png?alt=media&token=b701754a-d52c-4b60-bfd8-6a44a88f3bfd'
  const usersDB = db.collection('users')
  const templateJson = {
    nickname: '',
    first_name: '',
    last_name: '',
    password: '',
    gender: '',
    email: '',
    birth_date: '',
  }
  //insert user
  router.post('/insert', (req, res) => {
    let err = { error: 'The value of the fields equal to 1 are taken', emailCheck: 0, nickCheck: 0 }

    const userBody = req.body
    const incorrectFields = general.keysMustInclude(templateJson, userBody)
    if (incorrectFields.incorrect_keys.length || Object.keys(incorrectFields.incorrect_value_type).length) {
      res.status(400).json({ error: 'Unmatched keys.', error_data: incorrectFields })
      return
    }
    const nickname = userBody.nickname
    const email = userBody.email
    const social = {
      followers: [],
      following: [],
      posts_saved: [],
      total_likes: 0,
      total_share: 0,
      total_saves: 0,
      rank: { rank_name: 'Rookie', exp: 0, next_rank: 5 },
    }
    userBody.social = social
    userBody.avatar = defaultAvatar
    usersDB
      .find()
      .forEach((user) => {
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
          usersDB.insertOne(userBody)
          res.status(200).json(userBody)
        }
      })
      .catch(() => {
        res.status(500).json({ error: "Couldn't onnect to DB" })
      })
  })

  //insert user Avatar
  router.post('/:userid/avatar/upload', upload.single('image'), async (req, res) => {
    const userId = req.params.userid
    const result = await general.uploadFile(req.file)
    if (result.success) {
      usersDB.updateOne({ _id: new ObjectId(userId) }, { $set: { avatar: result.downloadURL } })
      res.status(200).json({ message: 'Avatar set successfully', file: result })
    } else {
      res.status(400).json({ error: 'Avatar failed to upload' })
    }
  })

  // remove avatar uplaod
  router.delete('/:userid/avatar/remove', async (req, res) => {
    const userId = req.params.userid
    const result = await general.removeFile(req.body.avatar_url)
    if (result.success) {
      usersDB.updateOne({ _id: new ObjectId(userId) }, { $set: { avatar: defaultAvatar } })
      res.status(200).json({ message: 'removed file successfully' })
    } else {
      res.status(400).send(result.error)
    }
  })

  //user deletion
  router.delete('/:userid/delete', (req, res) => {
    let err = { error: 'User does not exist' }
    const userID = req.params.userid
    usersDB
      .deleteOne({ _id: new ObjectId(userID) })
      .then(() => {
        res.status(200).json({ message: 'User Removed Successfully' })
      })
      .catch(() => {
        res.status(404).json(err)
      })
  })

  //update user
  router.post('/:userid/update', async (req, res) => {
    const userID = req.params.userid
    const incorrectFields = general.areKeysIncluded(templateJson, req.body)
    if (Object.keys(incorrectFields.inccorect_fields).length) {
      res.status(400).json({ error: 'Unmatched keys.', error_data: incorrectFields })
      return
    }
    //refactor for flags
    if (req.body.email) {
      const existingUser = await usersDB.findOne({ email: req.body.email })
      if (existingUser !== null) {
        res.status(400).json({ message: 'Email is taken' })
        return
      }
    }
    if (req.body.nickname) {
      const existingUser = await usersDB.findOne({ nickname: req.body.nickname })
      if (existingUser !== null) {
        res.status(400).json({ message: 'Nickname is taken' })
        return
      }
    }

    usersDB
      .updateOne({ _id: new ObjectId(userID) }, { $set: req.body })
      .then(() => {
        res.status(200).json({ message: 'User Updated Successfully' })
      })
      .catch(() => {
        res.status(404).json({ error: 'Update Failed' })
      })
  })

  //certain users data
  router.get('/:userid/data', (req, res) => {
    let err = { error: 'User does not exist' }
    const userID = req.params.userid
    usersDB
      .findOne({ _id: new ObjectId(userID) })
      .then((user) => {
        res.status(200).json(user)
      })
      .catch(() => {
        res.status(404).json(err)
      })
  })

  //all users data
  router.get('/all', (req, res) => {
    let err = { error: 'Failed to fetch users' }
    let usersList = []
    usersDB
      .find()
      .forEach((user) => {
        usersList.push(user)
      })
      .then(() => {
        res.status(200).json({ users: usersList })
      })
      .catch(() => {
        res.status(404).json(err)
      })
  })

  return router
}

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
