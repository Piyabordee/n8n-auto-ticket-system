import sql from 'mssql'

const config = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: false, // Disable encryption for Node.js 18 compatibility
    trustServerCertificate: true
  }
}

export async function getConnection() {
  try {
    const pool = await sql.connect(config)
    return pool
  } catch (error) {
    console.error('SQL connection error:', error)
    throw error
  }
}

export async function closeConnection(pool: sql.ConnectionPool) {
  try {
    await pool.close()
  } catch (error) {
    console.error('SQL close error:', error)
  }
}
