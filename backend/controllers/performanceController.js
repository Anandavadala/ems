const pool = require('../config/db');

// GET /performance
const getReviews = async (req, res) => {
  try {
    const { employee_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (employee_id) { conditions.push(`pr.employee_id = $${idx++}`); params.push(employee_id); }
    if (status) { conditions.push(`pr.status = $${idx++}`); params.push(status); }

    if (req.user.role_name === 'employee') {
      const empRes = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empRes.rows.length > 0) { conditions.push(`pr.employee_id = $${idx++}`); params.push(empRes.rows[0].id); }
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT pr.*, e.full_name, e.employee_id as emp_code, r.full_name as reviewer_name
       FROM performance_reviews pr
       JOIN employees e ON pr.employee_id = e.id
       LEFT JOIN employees r ON pr.reviewer_id = r.id
       ${where} ORDER BY pr.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return res.json({ success: true, reviews: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /performance
const createReview = async (req, res) => {
  try {
    const { employee_id, reviewer_id, review_period, review_type, goals } = req.body;
    const result = await pool.query(
      `INSERT INTO performance_reviews (employee_id, reviewer_id, review_period, review_type, goals, status)
       VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
      [employee_id, reviewer_id, review_period, review_type || 'annual', JSON.stringify(goals || [])]
    );
    return res.status(201).json({ success: true, review: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /performance/:id/submit
const submitSelfReview = async (req, res) => {
  try {
    const { self_rating, self_feedback } = req.body;
    await pool.query(
      'UPDATE performance_reviews SET self_rating=$1, self_feedback=$2, status=$3, updated_at=NOW() WHERE id=$4',
      [self_rating, self_feedback, 'self_submitted', req.params.id]
    );
    return res.json({ success: true, message: 'Self review submitted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /performance/:id/manager-review
const submitManagerReview = async (req, res) => {
  try {
    const { manager_rating, manager_feedback, final_rating } = req.body;
    await pool.query(
      'UPDATE performance_reviews SET manager_rating=$1, manager_feedback=$2, final_rating=$3, status=$4, review_date=NOW(), updated_at=NOW() WHERE id=$5',
      [manager_rating, manager_feedback, final_rating, 'finalized', req.params.id]
    );
    return res.json({ success: true, message: 'Manager review submitted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getReviews, createReview, submitSelfReview, submitManagerReview };
