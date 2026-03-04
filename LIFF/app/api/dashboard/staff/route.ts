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
  const month = searchParams.get('month')

  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  const startMonth = month ? parseInt(month) : 1
  const endMonth = month ? parseInt(month) : 12

  const startDate = new Date(currentYear, startMonth - 1, 1)
  const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59)

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Get staff performance stats
    const staffResult = await pool.request()
      .input('startDate', sql.DateTime(startDate))
      .input('endDate', sql.DateTime(endDate))
      .query(`
        SELECT
          assigned_to,
          COUNT(*) as totalAssigned,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as totalClosed,
          AVG(CASE WHEN status = 'closed' AND close_time_minute IS NOT NULL THEN close_time_minute END) as avgTime
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        AND assigned_to IS NOT NULL
        AND assigned_to != ''
        GROUP BY assigned_to
        ORDER BY totalClosed DESC
      `)

    // Format results with ranking
    const staffData = staffResult.recordset.map((row, index) => ({
      rank: index + 1,
      name: row.assigned_to,
      totalAssigned: row.totalAssigned,
      totalClosed: row.totalClosed,
      avgTime: row.avgTime ? Math.round(row.avgTime * 10) / 10 : 0
    }))

    return NextResponse.json({ staff: staffData })
  } catch (error) {
    console.error('Staff API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff performance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
