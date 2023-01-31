const Pool = require('pg').Pool
require('dotenv').config()

const connectionString = process.env.ConnectionString
const pool = new Pool({
  connectionString
})

module.exports = pool