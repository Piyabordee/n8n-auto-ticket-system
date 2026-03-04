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

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')

  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  const startDate = new Date(currentYear, 0, 1).toISOString()
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59).toISOString()

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Get monthly totals
    const monthlyResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT
          MONTH(created_date) as month,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        GROUP BY MONTH(created_date)
        ORDER BY month
      `)

    // Build data for all 12 months (fill missing with 0)
    const monthlyData = THAI_MONTHS.map((monthName, index) => {
      const found = monthlyResult.recordset.find(r => r.month === index + 1)
      return {
        month: monthName,
        total: found?.total || 0,
        closed: found?.closed || 0
      }
    })

    return NextResponse.json({ data: monthlyData })
  } catch (error) {
    console.error('Monthly API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
