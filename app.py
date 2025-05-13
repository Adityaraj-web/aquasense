import time
import math
import random
import csv
from io import StringIO
from flask import Flask, render_template, jsonify, make_response, send_from_directory
from datetime import datetime

app = Flask(__name__, template_folder='templates')

# --- Sensor Simulation Functions ---
def get_realistic_ph():
    if random.random() < 0.3:
        return round(random.uniform(4.0, 5.5) if random.random() < 0.5 else random.uniform(8.5, 12.0), 2)
    return round(random.uniform(6.0, 8.0), 2)

def get_realistic_ec():
    if random.random() < 0.3:
        return round(random.uniform(1500, 5000), 2)
    return round(random.uniform(300, 1200), 2)

def get_realistic_turbidity():
    if random.random() < 0.3:
        return round(random.uniform(5.0, 15.0), 1)
    return round(random.uniform(0.1, 4.9), 1)

def get_realistic_temperature():
    hour = datetime.now().hour
    base_temp = 10 + 10 * math.sin((hour - 6) * math.pi / 12)
    if random.random() < 0.2:
        return round(base_temp + random.uniform(-5, 15), 1)
    return round(base_temp + random.uniform(-1, 1), 1)

def determine_water_status(ph, ec, turbidity=None, temperature=None):
    if (6.5 <= ph <= 8.5) and (ec <= 1500):
        water_type_status = "Potable"
    elif ((5.5 <= ph < 6.5) or (8.5 < ph <= 9.0)) and (1500 < ec <= 2000):
        water_type_status = "Marginal"
    else:
        water_type_status = "Contaminated"
    
    if (6.5 <= ph <= 8.5) and (ec <= 1500):
        parameter_status = "Optimal"
    elif ((5.5 <= ph < 6.5) or (8.5 < ph <= 9.0)) and (1500 < ec <= 2000):
        parameter_status = "Moderate"
    else:
        parameter_status = "Critical"
    
    return parameter_status, water_type_status

# --- Routes ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/data')
def get_sensor_data():
    ph = get_realistic_ph()
    ec = get_realistic_ec()
    turbidity = get_realistic_turbidity()
    temperature = get_realistic_temperature()
    
    parameter_status, water_type_status = determine_water_status(ph, ec)
    
    alerts = []
    if ph < 6.5:
        alerts.append(f"Low pH detected: {ph}")
    elif ph > 8.5:
        alerts.append(f"High pH detected: {ph}")
    if ec > 1500:
        alerts.append(f"High EC detected: {ec} µS/cm")
    if turbidity > 5:
        alerts.append(f"Turbidity high: {turbidity} NTU")
    if temperature > 30 or temperature < 15:
        alerts.append(f"Temperature {'low' if temperature < 15 else 'high'}: {temperature}°C")

    return jsonify({
        "ph": ph,
        "ec": ec,
        "turbidity": turbidity,
        "temperature": temperature,
        "parameter_status": parameter_status,
        "water_type_status": water_type_status,
        "alerts": alerts,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/download-csv')
def download_csv():
    data = {
        "Timestamp": [datetime.now().strftime("%Y-%m-%d %H:%M:%S") for _ in range(10)],
        "pH": [round(random.uniform(5.0, 9.0), 2) for _ in range(10)],
        "EC": [round(random.uniform(200, 2500), 2) for _ in range(10)],
        "Status": [determine_water_status(p, e) for p, e in zip(
            [round(random.uniform(5.0, 9.0), 2) for _ in range(10)],
            [round(random.uniform(200, 2500), 2) for _ in range(10)]
        )]
    }

    csv_data = StringIO()
    writer = csv.writer(csv_data)
    writer.writerow(data.keys())
    writer.writerows(zip(*data.values()))

    response = make_response(csv_data.getvalue())
    response.headers['Content-Disposition'] = 'attachment; filename=water_quality_report.csv'
    response.headers['Content-type'] = 'text/csv'
    return response

# --- Utility Routes ---
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# --- Error Handlers ---
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500

# --- Cache Control ---
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

@app.context_processor
def inject_timestamp():
    return {'timestamp': int(time.time())}

if __name__ == '__main__':
    app.run(debug=True)