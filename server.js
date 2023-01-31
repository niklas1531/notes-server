const PORT = process.env.PORT ?? 8000
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())

const pool = require('./db')
const bcrypt = require('bcrypt')
const {v4: uuidv4} = require('uuid')
const jwt = require('jsonwebtoken')


//Get all notes
app.get('/users', async (req, res) => {
    try {
        const todos = await pool.query(`SELECT * FROM users`)
        res.json(todos.rows)
    } catch (error) {
        console.log(error)
    }
})

app.post('/signup', async(req,res) => {
    const {email, password} = req.body
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)
    try {
        const signed = await pool.query(`INSERT INTO users(email, hashed_password) VALUES($1,$2)`, [email, hashedPassword])
        const token = jwt.sign({email}, 'secrets', {expiresIn: '1hr'})
        res.json({email,token})
    } catch (error) {
        res.json({detail: error.detail})
    }
})

// Login
app.post('/login', async(req,res) => {
    const {email, password} = req.body
    try {
        const users = await pool.query(`SELECT * FROM users WHERE email=$1`, [email])
        if(!users.rows.length){
            res.json({detail: 'User does not exist!'})
        }
        const success = await bcrypt.compare(password, users.rows[0].hashed_password)
        const token = jwt.sign({email}, 'secrets', {expiresIn: '1hr'})
        if(success){
            res.json({'email': users.rows[0].email, token})
        }else {
            res.json({detail: 'Login failed'})
        }
    } catch (error) {
        res.json({detail: error.detail})
    }
})

//Get all notes
app.get('/notes/:userEmail', async (req, res) => {
    const { userEmail } = req.params
    try {
        const todos = await pool.query(`SELECT * FROM notes WHERE user_email=$1`, [userEmail])
        res.json(todos.rows)
    } catch (error) {
        console.log(error)
    }
})
app.post('/notes', async (req, res) => {
    const { user_email, title, progress, date } = req.body
    const id = uuidv4()
    try {
        const newToDo = await pool.query(`INSERT INTO todos(id, user_email, title, progress, date) VALUES($1,$2,$3,$4,$5)`, [id, user_email, title, progress, date])
        res.json(newToDo)
    } catch (error) {
        console.log(error)
    }
})
app.put('/notes/:id', async (req, res) => {
    const { id } = req.params
    const { user_email, title, progress, date } = req.body
    try {
        const editTodo = await pool.query(`UPDATE notes SET user_email = $1 , title = $2, progress=$3, date=$4 WHERE id=$5;`, [user_email, title, progress, date, id])
        res.json(editTodo)
    } catch (error) {
        console.error(error)
    }
})

app.delete('/notes/:id', async (req, res) => {
    const { id } = req.params
    try {
        const deleteTodo = await pool.query(`DELETE FROM notes WHERE id=$1;`, [id])
        res.json(deleteTodo)
    } catch (error) {
        console.error(error)
    }
})
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))