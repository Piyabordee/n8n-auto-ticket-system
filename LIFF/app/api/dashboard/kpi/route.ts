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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month') // null = all months

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Build date range
    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const startMonth = month ? parseInt(month) : 1
    const endMonth = month ? parseInt(month) : 12

    const startDate = new Date(currentYear, startMonth - 1, 1).toISOString()
    const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59).toISOString()

    // Total tickets
    const totalResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT COUNT(*) as total
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
      `)
    const total = totalResult.recordset[0].total

    // Closed tickets
    const closedResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT COUNT(*) as closed
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        AND status = 'closed'
      `)
    const closed = closedResult.recordset[0].closed

    // Average resolution time (in minutes)
    const avgTimeResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT AVG(close_time_minute) as avgTime
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        AND status = 'closed'
        AND close_time_minute IS NOT NULL
      `)
    const avgTime = avgTimeResult.recordset[0].avgTime || 0

    // Pending tickets (not closed yet)
    const pendingResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT COUNT(*) as pending
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        AND status IN ('pending', 'assigned')
      `)
    const pending = pendingResult.recordset[0].pending

    // Close rate percentage
    const closeRate = total > 0 ? Math.round((closed / total) * 100) : 0

    return NextResponse.json({
      total,
      closed,
      closeRate,
      avgTime: Math.round(avgTime * 10) / 10, // 1 decimal place
      pending
    })
  } catch (error) {
    console.error('KPI API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
