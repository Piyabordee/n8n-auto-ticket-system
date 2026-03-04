import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'

const sqlConfig = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
}

interface Ticket {
  message_id: string
  subject: string
  status: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string
  clean_text?: string
  fromuser?: string
  assigned_to?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const message_id = searchParams.get('message_id')

  if (!message_id) {
    return NextResponse.json({ error: 'message_id is required' }, { status: 400 })
  }

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Get ticket by message_id
    const result = await pool.request()
      .input('message_id', sql.VarChar, message_id)
      .query(`
        SELECT
          message_id,
          subject,
          status,
          category,
          sub_category,
          branch_name,
          clean_text,
          fromuser,
          assigned_to,
          created_date
        FROM [Dev_Born].[dbo].[ticket]
        WHERE message_id = @message_id
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const row = result.recordset[0]
    const ticket: Ticket = {
      message_id: row.message_id,
      subject: row.subject || '(ไม่มีหัวข้อ)',
      status: row.status || 'pending',
      category: row.category || '-',
      sub_category: row.sub_category || '-',
      branch_name: row.branch_name || '-',
      clean_text: row.clean_text || undefined,
      fromuser: row.fromuser || undefined,
      assigned_to: row.assigned_to || undefined,
      created_date: row.created_date ? new Date(row.created_date).toISOString() : new Date().toISOString()
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('SQL Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}
