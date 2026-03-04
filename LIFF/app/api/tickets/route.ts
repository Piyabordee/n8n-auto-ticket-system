import { NextRequest, NextResponse } from 'next/server'
import { getConnection, closeConnection } from '@/lib/sql'
import sql from 'mssql'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const pool = await getConnection()

    // KPI: Total tickets
    const totalResult = await pool.request()
      .input('userId', sql.VarChar(50), userId)
      .query(`
        SELECT COUNT(*) as total
        FROM [YourDatabase].[dbo].[ticket]
        WHERE userid = @userId
      `)
    const total = totalResult.recordset[0].total

    // KPI: Closed tickets
    const closedResult = await pool.request()
      .input('userId', sql.VarChar(50), userId)
      .query(`
        SELECT COUNT(*) as closed
        FROM [YourDatabase].[dbo].[ticket]
        WHERE userid = @userId AND status = 'closed'
      `)
    const closed = closedResult.recordset[0].closed

    // Recent tickets
    const ticketsResult = await pool.request()
      .input('userId', sql.VarChar(50), userId)
      .query(`
        SELECT TOP 20
          message_id, subject, status, category,
          sub_category, branch_name, created_date
        FROM [YourDatabase].[dbo].[ticket]
        WHERE userid = @userId
        ORDER BY created_date DESC
      `)

    await closeConnection(pool)

    return NextResponse.json({
      kpi: { total, closed },
      tickets: ticketsResult.recordset
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
