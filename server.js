const PORT = process.env.PORT ?? 8000
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())

const pool = require('./db')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')


//Get all notes
app.get('/usersandnumbers', async (req, res) => {
    try {
        const todos = await pool.query(`SELECT user_email, count(*) FROM notes GROUP BY user_email;`)
        res.json(todos.rows)
    } catch (error) {
        console.log(error)
    }
})

app.post('/signup', async (req, res) => {
    const { email, password } = req.body
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)
    try {
        const signed = await pool.query(`INSERT INTO users(email, hashed_password) VALUES($1,$2)`, [email, hashedPassword])
        const token = jwt.sign({ email }, 'secrets', { expiresIn: '1hr' })
        res.json({ email, token })
    } catch (error) {
        res.json({ detail: error.detail })
    }
})

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const users = await pool.query(`SELECT * FROM users WHERE email=$1`, [email])
        if (!users.rows.length) {
            res.json({ detail: 'User does not exist!' })
        }
        const success = await bcrypt.compare(password, users.rows[0].hashed_password)
        const token = jwt.sign({ email }, 'secrets', { expiresIn: '1hr' })
        if (success) {
            res.json({ 'email': users.rows[0].email, token })
        } else {
            res.json({ detail: 'Login failed' })
        }
    } catch (error) {
        res.json({ detail: error.detail })
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
    const { user_email, title, progress, date, category, content, type } = req.body
    const id = uuidv4()
    try {
        const newToDo = await pool.query(`INSERT INTO notes(id, user_email, title, progress, date, category, content, type) VALUES($1,$2,$3,$4,$5,$6, $7, $8)`, [id, user_email, title, progress, date, category, content, type])
        res.json(newToDo)
    } catch (error) {
        console.log(error)
    }
})
app.put('/notes/:id', async (req, res) => {
    const { id } = req.params
    const { user_email, title, progress, date, category, content, type } = req.body
    try {
        const editTodo = await pool.query(`UPDATE notes SET user_email = $1 , title = $2, progress=$3, date=$4, category=$5, content=$6, type=$7 WHERE id=$8;`, [user_email, title, progress, date, category, content, type, id])
        res.json(editTodo)
    } catch (error) {
        console.error(error)
    }
})


// Change pw 
app.put('/settings/:userEmail', async (req, res) => {
    const { userEmail } = req.params
    const { password } = req.body
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)
    try {
        const response = await pool.query(`UPDATE users SET hashed_password=$1 WHERE email=$2`, [hashedPassword, userEmail])
        res.json(response);
    } catch (error) {
        res.json({ detail: error.detail })
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

app.delete('/deleteuser/:email', async (req, res) => {
    const { email } = req.params
    try {
        const response = await pool.query(`DELETE FROM users WHERE email=$1`, [email])
        res.json(response)
    } catch (error) {
        console.log(error)
    }
})
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))