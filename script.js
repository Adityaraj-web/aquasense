// Chart Initialization
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'pH Value',
                data: [],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            },
            {
                label: 'EC (µS/cm)',
                data: [],
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            },
            {
                label: 'Turbidity (NTU)',
                data: [],
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                borderWidth: 2,
                tension: 0.1
            },
            {
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
                tension: 0.1
            }
        ]
    },
    options: {
        responsive: true,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    }
});

// DOM Elements
const elements = {
    connectionStatus: document.getElementById('connection-status'),
    connectionIcon: document.getElementById('connection-icon'),
    lastUpdatedTime: document.getElementById('last-updated-time'),
    phValue: document.getElementById('ph-value'),
    ecValue: document.getElementById('ec-value'),
    waterType: document.getElementById('water-type'),
    waterUse: document.getElementById('water-use'),
    waterQualityBar: document.getElementById('water-quality-bar'),
    phStatus: document.getElementById('ph-status'),
    ecStatus: document.getElementById('ec-status'),
    dynamicAlert: document.getElementById('dynamic-alert'),
    warningPopup: document.getElementById('warning-popup'),
    warningMessage: document.getElementById('warning-message'),
    turbidityValue: document.getElementById('turbidity-value'),
    temperatureValue: document.getElementById('temperature-value'),
    turbidityStatus: document.getElementById('turbidity-status'),
    temperatureStatus: document.getElementById('temperature-status')
};

// ===== NEW: Dark Mode Elements ===== //
    elements.darkModeToggle = document.createElement('button');
    elements.darkModeToggle.id = 'dark-mode-toggle';
    elements.darkModeToggle.className = 'btn btn-sm btn-outline-secondary position-fixed';
    elements.darkModeToggle.style.bottom = '20px';
    elements.darkModeToggle.style.right = '20px';
    elements.darkModeToggle.style.zIndex = '1000';
    elements.darkModeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
    document.body.appendChild(elements.darkModeToggle); 

// API Functions
async function fetchData() {
    const cacheBuster = `?_=${Date.now()}`;
    try {
        const response = await fetch(`/api/data${cacheBuster}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store'
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log("API Data:", data);
        
        // Updated required fields to include both status types
        const requiredFields = [
            'ph', 'ec', 'turbidity', 'temperature',
            'parameter_status', 'water_type_status'  // Both status fields are now required
        ];
        
        const missingFields = requiredFields.filter(field => !(field in data));
        if (missingFields.length > 0) {
            throw new Error(`Missing fields: ${missingFields.join(', ')}`);
        }
        
        return {
            ...data,
            // Ensure backward compatibility
            status: data.water_type_status  // For any components still expecting 'status'
        };
        
    } catch (error) {
        console.error("Fetch Error:", error);
        showWarningPopup(`Data Error: ${error.message}`);
        return null;
    }
}

// Example usage in your update function:
function updateDashboard(data) {
    if (!data) return;
    
    // For water type card (using water_type_status)
    document.getElementById('water-type-card').textContent = data.water_type_status;
    
    // For parameter cards (using parameter_status)
    document.getElementById('ph-status').textContent = data.parameter_status;
    document.getElementById('ec-status').textContent = data.parameter_status;
    // ... and so on for other parameters
    
    // For components still using 'status' (backward compatibility)
    document.getElementById('overall-status').textContent = data.status;
}
// Update Functions
function updateStatus(parameter, value) {
    const badge = elements[`${parameter}Status`];
    if (parameter === 'ph') {
        if (value < 6.5) {
            badge.className = 'status-badge bg-danger text-white';
            badge.textContent = 'Too Low';
        } else if (value > 8.5) {
            badge.className = 'status-badge bg-danger text-white';
            badge.textContent = 'Too High';
        } else {
            badge.className = 'status-badge bg-success text-white';
            badge.textContent = 'Optimal';
        }
    } else if (parameter === 'ec') {
        if (value > 2000) {
            badge.className = 'status-badge bg-danger text-white';
            badge.textContent = 'Dangerous';
        } else if (value > 1500) {
            badge.className = 'status-badge bg-warning text-dark';
            badge.textContent = 'High';
        } else if (value > 800) {
            badge.className = 'status-badge bg-info text-white';
            badge.textContent = 'Moderate';
        } else {
            badge.className = 'status-badge bg-success text-white';
            badge.textContent = 'Low';
        }
    } else if (parameter === 'turbidity') {
        if (value > 5) {
            badge.className = 'status-badge bg-danger text-white';
            badge.textContent = 'High';
        } else if (value > 3) {
            badge.className = 'status-badge bg-warning text-dark';
            badge.textContent = 'Moderate';
        } else {
            badge.className = 'status-badge bg-success text-white';
            badge.textContent = 'Low';
        }
    } else if (parameter === 'temperature') {
        if (value > 30 || value < 10) {
            badge.className = 'status-badge bg-danger text-white';
            badge.textContent = 'Extreme';
        } else if (value > 28 || value < 15) {
            badge.className = 'status-badge bg-warning text-dark';
            badge.textContent = 'Warning';
        } else {
            badge.className = 'status-badge bg-success text-white';
            badge.textContent = 'Normal';
        }
    }
}

function updateWaterTypeCard(status, ph, ec, turbidity, temperature) {
    let qualityPercent = 0;
    let useText = '';
    let barColor = 'bg-secondary';
    let textColor = 'text-muted';
    let reasons = []; // Array to store contamination reasons

    // Detailed quality assessment
    if (status === 'Potable') {
        qualityPercent = 100;
        useText = 'Safe for drinking and cooking';
        barColor = 'bg-success';
        textColor = 'text-success';
    } else if (status === 'Marginal') {
        qualityPercent = 60;
        useText = 'Limited domestic use only';
        barColor = 'bg-warning';
        textColor = 'text-warning';
        
        // Add specific marginal reasons
        if (ph < 6.5 || ph > 8.5) reasons.push(`pH ${ph}`);
        if (ec > 1500) reasons.push(`EC ${ec} µS/cm`);
        if (turbidity > 3) reasons.push(`Turbidity ${turbidity} NTU`);
        if (temperature < 15 || temperature > 28) reasons.push(`Temp ${temperature}°C`);
    } else {
        qualityPercent = 20;
        barColor = 'bg-danger';
        textColor = 'text-danger';
        
        // Determine specific contamination reasons
        if (ph < 5.5 || ph > 9.0) reasons.push(`Dangerous pH ${ph}`);
        if (ec > 2000) reasons.push(`High EC ${ec} µS/cm`);
        if (turbidity > 5) reasons.push(`Turbid ${turbidity} NTU`);
        if (temperature < 10 || temperature > 35) reasons.push(`Extreme Temp ${temperature}°C`);
        
        useText = reasons.length > 0 ? 
            `Unsafe: ${reasons.join(', ')}` : 
            'Not safe for consumption';
    }

    // Update UI elements
    elements.waterUse.textContent = useText;
    elements.waterUse.className = `small mt-1 ${textColor}`;
    elements.waterQualityBar.className = `progress-bar ${barColor}`;
    elements.waterQualityBar.style.width = `${qualityPercent}%`;

    // Add tooltip with detailed readings
    elements.waterType.title = `pH: ${ph} | EC: ${ec} µS/cm\nTurbidity: ${turbidity} NTU | Temp: ${temperature}°C`;
}
function updateChart(data) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    chart.data.labels.push(timeLabel);
    chart.data.datasets[0].data.push(data.ph);
    chart.data.datasets[1].data.push(data.ec);
    chart.data.datasets[2].data.push(data.turbidity);
    chart.data.datasets[3].data.push(data.temperature);
    
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    chart.update();
}

function updateRecentReadings(data) {
    const now = new Date();
    const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    //Update all four readings
    const updateReading = (index, value, unit = '') => {
        const item = document.querySelector(`.list-group-item:nth-child(${index})`);
        item.querySelector('span').textContent = unit ? `${value} ${unit}` : value;
        item.querySelector('small').textContent = timeText;
    };
    updateReading(1, data.ph.toFixed(1));
    updateReading(2, data.ec.toFixed(0), 'µS/cm');
    updateReading(3, data.turbidity.toFixed(1), 'NTU');
    updateReading(4, data.temperature.toFixed(1), '°C');
}

function showAlerts(alerts) {
    elements.dynamicAlert.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Alert:</strong> ${alerts.join(' | ')}
        <button type="button" class="btn-close p-2" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    elements.dynamicAlert.classList.remove('d-none');
    elements.dynamicAlert.classList.add('show');
}

function showWarningPopup(message) {
    elements.warningMessage.textContent = message;
    elements.warningPopup.style.display = 'block';
    
    setTimeout(() => {
        elements.warningPopup.style.display = 'none';
    }, 5000);
}
// ===== NEW: Dark Mode Toggle Function ===== //
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    elements.darkModeToggle.innerHTML = isDark 
        ? '<i class="bi bi-sun-fill"></i>' 
        : '<i class="bi bi-moon-fill"></i>';
}
function initTemporaryAlert() {
    const alertEl = document.createElement('div');
    alertEl.id = 'temporary-alert';
    alertEl.className = 'alert alert-warning temporary-alert';
    document.body.appendChild(alertEl);
}

function showTemporaryAlert(message, type = 'warning') {
    const alertEl = document.getElementById('temporary-alert');
    if (!alertEl) {
        initTemporaryAlert();
        return showTemporaryAlert(message, type); // Retry after init
    }
    
    // Clear any existing timeout
    if (alertEl.timeoutId) {
        clearTimeout(alertEl.timeoutId);
    }
    
    // Update alert content and style
    alertEl.className = `alert alert-${type} temporary-alert show`;
    alertEl.innerHTML = message;
    
    // Set timeout to hide
    alertEl.timeoutId = setTimeout(() => {
        alertEl.classList.remove('show');
    }, 2000);
}
// Main Dashboard Update Function
async function updateDashboard() {
    console.groupCollapsed("Dashboard Update Cycle");
    
    try {
        // 1. Show loading state only for connection status
        elements.connectionStatus.textContent = "Fetching...";
        elements.connectionIcon.className = "bi bi-arrow-repeat me-1 spin";

        // 2. Fetch data
        const data = await fetchData();
        console.log("API Response Data:", data);
        
        if (!data) {
            showWarningPopup("Failed to fetch data");
            return;
        }

        // 3. Validate data structure
        const requiredFields = ['ph', 'ec', 'turbidity', 'temperature', 'parameter_status', 'water_type_status'];
        const missingFields = requiredFields.filter(field => !(field in data));
        if (missingFields.length > 0) {
            throw new Error(`Missing fields: ${missingFields.join(', ')}`);
        }

        // 4. Update main values
        document.getElementById('ph-value').textContent = data.ph?.toFixed(1) || "--";
        document.getElementById('ec-value').textContent = data.ec?.toFixed(0) || "--";
        document.getElementById('turbidity-value').textContent = data.turbidity?.toFixed(1) || "--";
        document.getElementById('temperature-value').textContent = data.temperature?.toFixed(1) || "--";
        document.getElementById('water-type').textContent = data.water_type_status || data.status || "--";

        // 5. UPDATE PARAMETER STATUSES - THIS IS THE FIXED PART
        updateParameterStatus('ph', data.ph);
        updateParameterStatus('ec', data.ec);
        updateParameterStatus('turbidity', data.turbidity);
        updateParameterStatus('temperature', data.temperature);
        
        // 6. Update water type card
        updateWaterTypeCard(
            data.water_type_status || data.status,
            data.ph, 
            data.ec, 
            data.turbidity, 
            data.temperature
        );

        // Check for abnormal readings and show temporary warnings
        const warnings = [];
        if (data.ph < 6.5 || data.ph > 8.5) {
            warnings.push(`pH ${data.ph < 6.5 ? 'Low' : 'High'}: ${data.ph.toFixed(1)}`);
        }
        if (data.ec > 1500) {
            warnings.push(`EC High: ${data.ec.toFixed(0)} µS/cm`);
        }
        if (data.turbidity > 5) {
            warnings.push(`Turbidity High: ${data.turbidity.toFixed(1)} NTU`);
        }
        if (data.temperature > 30 || data.temperature < 15) {
            warnings.push(`Temperature ${data.temperature > 30 ? 'High' : 'Low'}: ${data.temperature.toFixed(1)}°C`);
        }

        if (warnings.length > 0) {
            showTemporaryAlert(warnings.join('<br>'), "warning");
        }

        // 7. Update chart
        if (!isNaN(data.ph) && !isNaN(data.ec)) {
            updateChart(data);
            updateRecentReadings(data);
        }

        // 8. Update connection status
        elements.connectionStatus.textContent = "Connected";
        elements.connectionIcon.className = "bi bi-circle-fill text-success me-1";
        elements.lastUpdatedTime.textContent = new Date(data.timestamp).toLocaleTimeString();

        // 9. Handle alerts
        if (Array.isArray(data.alerts) && data.alerts.length > 0) {
            showAlerts(data.alerts);
        } else {
            elements.dynamicAlert.classList.add('d-none');
        }

    } catch (error) {
        console.error("Dashboard update failed:", error);
        elements.connectionStatus.textContent = "Error";
        elements.connectionIcon.className = "bi bi-exclamation-triangle-fill text-danger me-1";
        showWarningPopup(`Update failed: ${error.message}`);
    } finally {
        console.groupEnd();
        elements.connectionIcon.classList.remove("spin");
    }
}

// NEW HELPER FUNCTION - This determines status for each parameter
function updateParameterStatus(parameter, value) {
    const statusElement = document.getElementById(`${parameter}-status`);
    if (!statusElement) return;

    let status = "";
    let statusClass = "";

    switch(parameter) {
        case 'ph':
            if (value < 6.5) {
                status = "Too Low";
                statusClass = "text-danger";
            } else if (value > 8.5) {
                status = "Too High"; 
                statusClass = "text-danger";
            } else {
                status = "Optimal";
                statusClass = "text-success";
            }
            break;
            
        case 'ec':
            if (value > 1500) {
                status = "Too High";
                statusClass = "text-danger";
            } else if (value < 300) {
                status = "Too Low";
                statusClass = "text-warning"; 
            } else {
                status = "Optimal";
                statusClass = "text-success";
            }
            break;
            
        case 'turbidity':
            if (value > 5) {
                status = "Too High";
                statusClass = "text-danger";
            } else {
                status = "Normal";
                statusClass = "text-success";
            }
            break;
            
        case 'temperature':
            if (value > 30 || value < 15) {
                status = value > 30 ? "Too High" : "Too Low";
                statusClass = "text-danger";
            } else {
                status = "Normal"; 
                statusClass = "text-success";
            }
            break;
    }

    statusElement.textContent = status;
    statusElement.className = `parameter-status ${statusClass}`;
}
function updateParameterStatuses(data) {
    const status = data.parameter_status || "Unknown";
    document.querySelectorAll('.parameter-status').forEach(el => {
        el.textContent = status;
        // Update status class for styling
        el.className = `parameter-status status-${status.toLowerCase()}`;
    });
}

function updateWaterTypeStatus(data) {
    const status = data.water_type_status || data.status || "Unknown";
    const waterTypeElement = document.getElementById('water-type-status');
    if (waterTypeElement) {
        waterTypeElement.textContent = status;
        waterTypeElement.className = `water-type-status status-${status.toLowerCase()}`;
    }
}

// NEW FUNCTION: Update all parameter status indicators
function updateParameterStatusIndicators(status) {
    // Update each parameter card's status indicator
    document.querySelectorAll('.parameter-status').forEach(element => {
        element.textContent = status;
        
        // Update styling based on status
        element.className = 'parameter-status badge rounded-pill ';
        switch(status) {
            case 'Optimal':
                element.classList.add('bg-success');
                break;
            case 'Moderate':
                element.classList.add('bg-warning');
                break;
            case 'Critical':
                element.classList.add('bg-danger');
                break;
            default:
                element.classList.add('bg-secondary');
        }
    });
}

// Add this CSS for the spinner
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
`);
// Event Listeners
function setupEventListeners() {
    // NEW: Card hover effects
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const x = e.clientX - card.getBoundingClientRect().left;
        const y = e.clientY - card.getBoundingClientRect().top;
        const centerX = card.offsetWidth / 2;
        const centerY = card.offsetHeight / 2;
        
        card.style.transform = `perspective(1000px) rotateX(${(y - centerY)/20}deg) rotateY(${(centerX - x)/20}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
});
    // Time range buttons
    document.querySelectorAll('[data-range]').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('[data-range]').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            console.log(`Selected range: ${this.dataset.range}`);
        });
    });

    // Download button
    document.getElementById('download-btn').addEventListener('click', () => {
        // Fetch CSV from Flask endpoint
        fetch('/download-csv')
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.blob();
            })
            .then(blob => {
                // Trigger download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'water_quality_report.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            })
            .catch(error => {
                console.error('Download failed:', error);
                alert('Failed to download CSV');
            });
    });
}

// Initialize (MODIFIED)
document.addEventListener('DOMContentLoaded', () => {
    // Page fade-in (keep existing)
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Dark mode preference (keep existing)
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        elements.darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    }
    // NEW: Add click handler for dark mode
    elements.darkModeToggle.addEventListener('click', toggleDarkMode);

    // Your existing initialization
    setupEventListeners();
    updateDashboard();
    setInterval(updateDashboard, 3000);
});