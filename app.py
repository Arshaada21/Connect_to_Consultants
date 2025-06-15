from flask import Flask, render_template, request, redirect, jsonify, send_from_directory
import sqlite3, os
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'reports'
os.makedirs('reports', exist_ok=True)

# Initialize database
conn = sqlite3.connect('database.db')
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT,
    doctor_id INTEGER,
    date TEXT,
    time TEXT
)''')
c.execute('''CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    client_name TEXT,
    filename TEXT,
    approved INTEGER DEFAULT 0
)''')
conn.commit()
conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit_appointment', methods=['POST'])
def submit_appointment():
    data = request.get_json()
    name = data['name']
    doctor = int(data['doctor'].split('.')[-1].strip()) if '.' in data['doctor'] else 1
    time = data['time']
    date_today = datetime.now().strftime("%Y-%m-%d")

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("INSERT INTO appointments (client_name, doctor_id, date, time) VALUES (?, ?, ?, ?)",
              (name, doctor, date_today, time))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/upload_report', methods=['POST'])
def upload_report():
    doctor = int(request.form['doctor'])
    client = request.form['client_name']
    file = request.files['report']
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("INSERT INTO reports (doctor_id, client_name, filename) VALUES (?, ?, ?)", (doctor, client, filename))
    conn.commit()
    conn.close()
    return 'Uploaded Successfully'

@app.route('/approve_report/<int:report_id>', methods=['GET'])
def approve_report(report_id):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("UPDATE reports SET approved = 1 WHERE id = ?", (report_id,))
    conn.commit()
    conn.close()
    return 'Report Approved'

@app.route('/download/<client_name>', methods=['GET'])
def download(client_name):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute("SELECT filename, approved FROM reports WHERE client_name = ? ORDER BY id DESC LIMIT 1", (client_name,))
        row = c.fetchone()
        conn.close()

        if not row:
            return 'No report found for this client.', 404

        if row[1] != 1:  # if not approved
            return 'Report is not approved yet.', 403

        filename = row[0]
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(file_path):
            return 'Report file not found.', 404

        return send_from_directory(
            app.config['UPLOAD_FOLDER'],
            filename,
            as_attachment=True,
            download_name=f"approved_report_{client_name}.pdf"
        )
    except Exception as e:
        print(f"Download error: {str(e)}")
        return 'Error downloading report.', 500

if __name__ == '__main__':
    app.run(debug=True)
