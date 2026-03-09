const pool = require('../config/db');

// GET /payroll
const getPayroll = async (req, res) => {
  try {
    const { month, year, employee_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (month) { conditions.push(`p.month = $${idx++}`); params.push(month); }
    if (year) { conditions.push(`p.year = $${idx++}`); params.push(year); }
    if (employee_id) { conditions.push(`p.employee_id = $${idx++}`); params.push(employee_id); }

    // Employees see only their own payroll
    if (req.user.role_name === 'employee') {
      const empRes = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empRes.rows.length > 0) {
        conditions.push(`p.employee_id = $${idx++}`);
        params.push(empRes.rows[0].id);
      }
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT p.*, e.full_name, e.employee_id as emp_code, d.name as department_name
       FROM payroll p JOIN employees e ON p.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${where} ORDER BY p.year DESC, p.month DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const countRes = await pool.query(`SELECT COUNT(*) FROM payroll p ${where}`, params.slice(0, -2));
    return res.json({
      success: true,
      payroll: result.rows,
      pagination: { total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /payroll/process
const processPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required.' });

    // Get all active employees with salary structure
    const employees = await pool.query(
      `SELECT e.id, e.full_name,
              ss.basic_salary, ss.hra_percent, ss.allowances, ss.variable_pay, ss.pf_percent, ss.esi_percent
       FROM employees e
       JOIN salary_structures ss ON ss.employee_id = e.id
       WHERE e.status = 'active'
       AND ss.effective_date = (SELECT MAX(ss2.effective_date) FROM salary_structures ss2 WHERE ss2.employee_id = e.id)`
    );

    const results = [];
    for (const emp of employees.rows) {
      const hra = (emp.basic_salary * emp.hra_percent) / 100;
      const gross = emp.basic_salary + hra + (emp.allowances || 0) + (emp.variable_pay || 0);
      const pf = (emp.basic_salary * (emp.pf_percent || 12)) / 100;
      const esi = gross <= 21000 ? (gross * (emp.esi_percent || 0.75)) / 100 : 0;
      const totalDeductions = pf + esi;
      const net = gross - totalDeductions;

      // Get attendance for month
      const attRes = await pool.query(
        `SELECT COUNT(*) as days_present FROM attendance WHERE employee_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3 AND status IN ('present','late','wfh')`,
        [emp.id, month, year]
      );

      const daysPresent = parseInt(attRes.rows[0].days_present) || 0;

      await pool.query(
        `INSERT INTO payroll (employee_id, month, year, basic_salary, hra, allowances, variable_pay, gross_salary, pf_deduction, esi_deduction, total_deductions, net_salary, days_present, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'processed')
         ON CONFLICT (employee_id, month, year) DO UPDATE SET
           basic_salary=$4, hra=$5, allowances=$6, variable_pay=$7, gross_salary=$8,
           pf_deduction=$9, esi_deduction=$10, total_deductions=$11, net_salary=$12,
           days_present=$13, status='processed', processed_at=NOW(), updated_at=NOW()`,
        [emp.id, month, year, emp.basic_salary, hra, emp.allowances || 0, emp.variable_pay || 0, gross, pf, esi, totalDeductions, net, daysPresent]
      );
      results.push({ employee_id: emp.id, name: emp.full_name, net });
    }

    return res.json({ success: true, message: `Payroll processed for ${employees.rows.length} employees.`, results });
  } catch (err) {
    console.error('ProcessPayroll error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /payroll/salary-structure/:employeeId
const getSalaryStructure = async (req, res) => {
  try {
    let result;
    if (req.params.employeeId) {
      result = await pool.query(
        `SELECT ss.*, e.full_name, e.employee_id FROM salary_structures ss
         JOIN employees e ON ss.employee_id = e.id
         WHERE ss.employee_id = $1 ORDER BY ss.effective_date DESC`,
        [req.params.employeeId]
      );
    } else {
      result = await pool.query(
        `SELECT ss.*, e.full_name, e.employee_id FROM salary_structures ss
         JOIN employees e ON ss.employee_id = e.id
         ORDER BY e.full_name ASC, ss.effective_date DESC`
      );
    }
    return res.json({ success: true, structures: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /payroll/salary-structure
const setSalaryStructure = async (req, res) => {
  try {
    const { employee_id, effective_date, basic_salary, hra_percent, allowances, variable_pay, pf_percent, esi_percent, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO salary_structures (employee_id, effective_date, basic_salary, hra_percent, allowances, variable_pay, pf_percent, esi_percent, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [employee_id, effective_date, basic_salary, hra_percent || 40, allowances || 0, variable_pay || 0, pf_percent || 12, esi_percent || 0.75, notes, req.user.id]
    );
    return res.status(201).json({ success: true, structure: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getPayroll, processPayroll, getSalaryStructure, setSalaryStructure };
