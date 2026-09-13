const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'prepai.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      profile_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Interviews table
  db.run(`
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      user_email TEXT,
      target_role TEXT,
      job_description TEXT,
      resume_summary TEXT,
      status TEXT DEFAULT 'CREATED',
      current_question_index INTEGER DEFAULT 0,
      overall_score INTEGER DEFAULT 0,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      interview_id TEXT,
      question_text TEXT,
      type TEXT,
      difficulty TEXT,
      order_index INTEGER,
      expected_topics TEXT,
      follow_up_reason TEXT,
      FOREIGN KEY(interview_id) REFERENCES interviews(id)
    )
  `);

  // Answers table
  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      question_id TEXT,
      interview_id TEXT,
      transcript TEXT,
      duration_seconds INTEGER,
      technical_score INTEGER,
      communication_score INTEGER,
      relevance_score INTEGER,
      completeness_score INTEGER,
      overall_score INTEGER,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(question_id) REFERENCES questions(id),
      FOREIGN KEY(interview_id) REFERENCES interviews(id)
    )
  `);

  // Interview Results table
  db.run(`
    CREATE TABLE IF NOT EXISTS interview_results (
      interview_id TEXT PRIMARY KEY,
      overall_score INTEGER,
      technical_score INTEGER,
      communication_score INTEGER,
      problem_solving_score INTEGER,
      relevance_score INTEGER,
      confidence_score INTEGER,
      strengths TEXT,
      weaknesses TEXT,
      recommendations TEXT,
      topics_to_improve TEXT,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(interview_id) REFERENCES interviews(id)
    )
  `);
});

// Database helper utilities with Promises
const dbQuery = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = { db, dbQuery };
