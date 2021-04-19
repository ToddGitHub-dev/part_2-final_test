const { User, Message } = require('../models/models')
const jwt = require('jsonwebtoken')
const { Router } = require('express')
const router = Router()



router.get('/', async function (req, res){
    let messages = await Message.findAll({})
    let data = { messages }

    res.render('index.ejs', data)
})


// This is the rout that is executed when the user 
// clicks on the like/love button
// Everytime the user likes a post,
//  the count variable is incremented
router.post('/count', async function(req, res){
    let { token } = req.cookies
    if (token) {                                    // If user still loged in, count likes/loves
        // Getting the user id 
        let id = req.body.id
        // Look up the message with the user id
        let message = await Message.findOne({where:{id: id}})
        // Increment the count
        message.count++;
        // Save it in the database
        await message.save()

    }
    // Return to home page
    res.redirect('/')
})

router.get('/createUser', async function(req, res){
    res.render('createUser.ejs')
})

router.post('/createUser', async function(req, res){
    let { username, password } = req.body

    try {
        await User.create({
            username,
            password,
            role: "user"
        })  
    } catch (e) {
        console.log(e)
    }

    res.redirect('/login')
})

// Logs the user out of the system
router.get('/logout', function(req, res) {
    // Gets the cookies
    let token = req.cookies.token

    // Verify is the cookie is still there
    if(token){
        // If there is a cookie, invalidate the cookie
        res.cookie('token', token, {
            expires: new Date(Date.now()),
            httpOnly: true
            })
        console.log('Logout')
        res.redirect('/')
    }else{
        // Else return to home
        console.log('err logout')
        res.redirect('/')
    }
})

router.get('/login', function(req, res) {
    res.render('login')
})

router.post('/login', async function(req, res) {
    let {username, password} = req.body

    let user;
    try {
        user = await User.findOne({
            where: {username}
        })
    } catch (e) {
        console.log(e)
    }

    if (user && user.password === password) {
        let data = {
            username: username,
            role: user.role
        }

        let token = jwt.sign(data, "theSecret")
        res.cookie("token", token)
        res.redirect('/')
    } else {
        res.redirect('/error')
    }
})

router.get('/message', async function (req, res) {
    let token = req.cookies.token 

    if (token) {                                      // very bad, no verify, don't do this
        res.render('message')
    } else {
        res.render('login')
    }
})

router.post('/message', async function(req, res){
    let { token } = req.cookies
    let { content } = req.body
    console.log(token)
    if (token) {
        let payload = await jwt.verify(token, "theSecret")  
 
        let user = await User.findOne({
            where: {username: payload.username}
        })

        let msg = await Message.create({
            content,
            userId: user.id
        })

        res.redirect('/')
    } else {
        res.redirect('/login')
    }
})

router.get('/error', function(req, res){
    res.render('error')
})

router.all('*', function(req, res){
    res.send('404 dude')
})

module.exports = router