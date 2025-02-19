// Approve payment workflow
function approvePayment(paymentId) {
    console.log('Opening approval modal for payment:', paymentId);
    
    // Get payment details
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
        showNotification('Payment not found', 'error');
        return;
    }

    // Populate modal with payment details
    document.getElementById('approvalPaymentId').value = paymentId;
    document.getElementById('approvalCarNumber').textContent = payment.carNumber;
    document.getElementById('approvalCarModel').textContent = payment.carModel;
    document.getElementById('approvalOwnerName').textContent = payment.ownerName;
    document.getElementById('approvalRentAmount').textContent = payment.amount;

    // Clear previous entries
    document.getElementById('absenceRows').innerHTML = '';
    document.getElementById('replacementRows').innerHTML = '';

    // Reset amounts
    updateFinalAmount();

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('paymentApprovalModal'));
    modal.show();
}

// Add absence row
function addAbsenceRow() {
    const container = document.getElementById('absenceRows');
    const rowId = Date.now();
    
    const row = document.createElement('div');
    row.className = 'row mb-2';
    row.innerHTML = `
        <div class="col-md-4">
            <input type="date" class="form-control absence-date" onchange="updateFinalAmount()">
        </div>
        <div class="col-md-6">
            <input type="text" class="form-control absence-reason" placeholder="Reason for absence">
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove(); updateFinalAmount()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(row);
}

// Add replacement row
function addReplacementRow() {
    const container = document.getElementById('replacementRows');
    const rowId = Date.now();
    
    const row = document.createElement('div');
    row.className = 'row mb-2';
    row.innerHTML = `
        <div class="col-md-3">
            <input type="date" class="form-control replacement-date" onchange="updateFinalAmount()">
        </div>
        <div class="col-md-4">
            <input type="text" class="form-control replacement-car" placeholder="Replacement Car">
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control replacement-amount" placeholder="Amount" onchange="updateFinalAmount()">
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove(); updateFinalAmount()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(row);
}

// Update final amount
function updateFinalAmount() {
    const rentAmount = Number(document.getElementById('approvalRentAmount').textContent);
    let deductions = 0;

    // Calculate absence deductions (daily rent amount)
    const dailyRent = rentAmount / 30;
    const absenceDates = document.querySelectorAll('.absence-date');
    deductions += absenceDates.length * dailyRent;

    // Calculate replacement deductions
    const replacementAmounts = document.querySelectorAll('.replacement-amount');
    replacementAmounts.forEach(input => {
        if (input.value) {
            deductions += Number(input.value);
        }
    });

    // Update display
    document.getElementById('totalDeductions').textContent = deductions.toFixed(2);
    document.getElementById('finalAmount').textContent = (rentAmount - deductions).toFixed(2);
}

// Handle payment approval form submission
document.getElementById('paymentApprovalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const paymentId = document.getElementById('approvalPaymentId').value;
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) {
        showNotification('Payment not found', 'error');
        return;
    }

    // Collect absence details
    const absences = [];
    document.querySelectorAll('#absenceRows .row').forEach(row => {
        const date = row.querySelector('.absence-date').value;
        const reason = row.querySelector('.absence-reason').value;
        if (date && reason) {
            absences.push({ date, reason });
        }
    });

    // Collect replacement details
    const replacements = [];
    document.querySelectorAll('#replacementRows .row').forEach(row => {
        const date = row.querySelector('.replacement-date').value;
        const car = row.querySelector('.replacement-car').value;
        const amount = row.querySelector('.replacement-amount').value;
        if (date && car && amount) {
            replacements.push({ date, car, amount });
        }
    });

    // Update payment
    payment.status = 'approved';
    payment.approvedBy = currentUser.username;
    payment.approvedAt = new Date().toISOString();
    payment.absences = absences;
    payment.replacements = replacements;
    payment.deductions = Number(document.getElementById('totalDeductions').textContent);
    payment.finalAmount = Number(document.getElementById('finalAmount').textContent);

    // Save to localStorage
    localStorage.setItem('payments', JSON.stringify(payments));

    // Close modal and update UI
    bootstrap.Modal.getInstance(document.getElementById('paymentApprovalModal')).hide();
    updatePaymentTable();
    
    // Generate invoice
    viewInvoice(paymentId);
    
    showNotification('Payment approved successfully', 'success');
});

// View invoice
function viewInvoice(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
        showNotification('Payment not found', 'error');
        return;
    }

    // Create invoice content
    const invoiceContent = `
        <div class="container">
            <div class="text-center mb-4">
                <h3>Sabbir Rent A Car</h3>
                <p>Ta 58/F, Gudaraghat, Middle Badda, Dhaka-1212</p>
                <p>Email: sabbirrentacar01@gmail.com</p>
                <p>Phone: +8801317361638, +8801726103097, +8801893420118</p>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5>Payment Details</h5>
                    <p><strong>Car Number:</strong> ${payment.carNumber}</p>
                    <p><strong>Car Model:</strong> ${payment.carModel}</p>
                    <p><strong>Owner Name:</strong> ${payment.ownerName}</p>
                    <p><strong>Month:</strong> ${payment.month}</p>
                </div>
                <div class="col-md-6 text-end">
                    <h5>Invoice #${payment.id}</h5>
                    <p><strong>Date:</strong> ${new Date(payment.approvedAt).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
                </div>
            </div>

            ${payment.absences?.length ? `
                <div class="mb-4">
                    <h5>Absence Details</h5>
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payment.absences.map(a => `
                                <tr>
                                    <td>${new Date(a.date).toLocaleDateString()}</td>
                                    <td>${a.reason}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            ${payment.replacements?.length ? `
                <div class="mb-4">
                    <h5>Replacement Details</h5>
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Replacement Car</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payment.replacements.map(r => `
                                <tr>
                                    <td>${new Date(r.date).toLocaleDateString()}</td>
                                    <td>${r.car}</td>
                                    <td>৳${r.amount}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            <div class="row">
                <div class="col-md-6 offset-md-6">
                    <table class="table table-sm">
                        <tr>
                            <td><strong>Monthly Rent:</strong></td>
                            <td class="text-end">৳${payment.amount}</td>
                        </tr>
                        <tr>
                            <td><strong>Total Deductions:</strong></td>
                            <td class="text-end">৳${payment.deductions || 0}</td>
                        </tr>
                        <tr>
                            <td><strong>Final Amount:</strong></td>
                            <td class="text-end">৳${payment.finalAmount || payment.amount}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-6">
                    <p><strong>Approved By:</strong> ${payment.approvedBy}</p>
                </div>
                <div class="col-md-6 text-end">
                    <p>Authorized Signature</p>
                </div>
            </div>
        </div>
    `;

    // Open invoice in new window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Invoice #${payment.id}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @media print {
                        .no-print { display: none; }
                    }
                    .container { max-width: 800px; margin: 20px auto; }
                </style>
            </head>
            <body>
                ${invoiceContent}
                <div class="text-center mt-4 no-print">
                    <button onclick="window.print()" class="btn btn-primary">Print Invoice</button>
                </div>
            </body>
        </html>
    `);
}

// Global variables
let currentUser = null;
let cars = [];
let payments = [];

// Load data from localStorage
function loadData() {
    console.log('Loading data...');
    
    // Load cars
    cars = JSON.parse(localStorage.getItem('cars')) || [];
    console.log('Loaded cars:', cars.length);

    // Load payments
    payments = JSON.parse(localStorage.getItem('payments')) || [];
    console.log('Loaded payments:', payments.length);

    // Generate payments for cars if none exist for current month
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    let newPaymentsAdded = false;
    
    cars.forEach(car => {
        if (car.status === 'active') {
            const hasPaymentForMonth = payments.some(p => 
                p.carNumber === car.number && 
                p.month === currentMonth
            );
            
            if (!hasPaymentForMonth) {
                console.log('Generating payment for car:', car.number);
                const payment = {
                    id: 'payment_' + Date.now() + '_' + car.id,
                    carNumber: car.number,
                    carModel: car.name,
                    ownerName: car.owner,
                    ownerMobile: car.mobile,
                    month: currentMonth,
                    amount: car.rent,
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                    status: 'pending',
                    createdBy: currentUser.username,
                    createdAt: new Date().toISOString()
                };
                
                payments.push(payment);
                newPaymentsAdded = true;
            }
        }
    });
    
    // Save updated payments if new ones were added
    if (newPaymentsAdded) {
        console.log('Saving new payments to localStorage');
        localStorage.setItem('payments', JSON.stringify(payments));
    }

    // Update UI based on role
    if (currentUser.role === 'admin') {
        updateDashboardStats();
        updatePaymentTable();
    } else if (currentUser.role === 'manager') {
        updateCarTable();
    } else if (currentUser.role === 'accountant') {
        updatePaymentTable();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    try {
        // Check if user is logged in
        const userJson = sessionStorage.getItem('currentUser');
        console.log('User JSON:', userJson);
        
        if (!userJson) {
            console.log('No user found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        // Parse user data
        currentUser = JSON.parse(userJson);
        console.log('Current user role:', currentUser.role);

        // Display user info
        document.getElementById('userDisplay').textContent = currentUser.username;

        // Show appropriate sidebar based on role
        showSidebarForRole(currentUser.role);

        // Update section visibility
        updateSectionVisibility();

        // Load data
        loadData();

        // Initialize payment filters if payments section is active
        if (document.getElementById('payments').classList.contains('active')) {
            console.log('Initializing payment management...');
            initializePaymentFilters();
            updatePaymentTable();
        }

        // Add event listeners
        addEventListeners();
        
        // Show welcome message
        showToast('Welcome ' + currentUser.username + '!', 'success');
        
    } catch (error) {
        console.error('Error during initialization:', error);
        showToast('Error initializing application', 'danger');
    }
});

// Show sidebar based on user role
function showSidebarForRole(role) {
    // Hide all sidebars first
    document.querySelectorAll('.sidebar').forEach(sidebar => {
        sidebar.style.display = 'none';
    });
    
    // Show the appropriate sidebar
    const sidebarId = role + 'Sidebar';
    const sidebar = document.getElementById(sidebarId);
    if (sidebar) {
        sidebar.style.display = 'flex';
        
        // Update profile section
        const profileName = sidebar.querySelector('.profile-name');
        const profileRole = sidebar.querySelector('.profile-role');
        
        if (profileName) {
            profileName.textContent = currentUser.username || 'User';
        }
        
        if (profileRole) {
            const roleDisplay = {
                admin: 'Administrator',
                manager: 'Car Manager',
                accountant: 'Accountant'
            }[role] || role;
            profileRole.textContent = roleDisplay;
        }
    }

    // Set body attribute for CSS role-based display
    document.body.setAttribute('data-role', role);
}

// Quick Action Handler
function quickAction(action) {
    const role = currentUser.role;
    
    // Role-specific actions
    const allowedActions = {
        admin: ['createUser', 'createRole', 'auditLog'],
        manager: ['newBooking', 'addCar', 'maintenance'],
        accountant: ['createInvoice', 'recordPayment', 'generateReport']
    };

    if (!allowedActions[role]?.includes(action)) {
        showToast('You do not have permission to perform this action.', 'danger');
        return;
    }

    switch(action) {
        // Admin Quick Actions
        case 'createUser':
            showModal('createUserModal');
            break;
        case 'createRole':
            showModal('createRoleModal');
            break;
        case 'auditLog':
            showSection('audit');
            break;
            
        // Manager Quick Actions
        case 'newBooking':
            showModal('newBookingModal');
            break;
        case 'addCar':
            showModal('addCarModal');
            break;
        case 'maintenance':
            showModal('maintenanceModal');
            break;
            
        // Accountant Quick Actions
        case 'createInvoice':
            showModal('createInvoiceModal');
            break;
        case 'recordPayment':
            showModal('recordPaymentModal');
            break;
        case 'generateReport':
            showModal('generateReportModal');
            break;
    }
}

// Update section visibility
function updateSectionVisibility() {
    console.log('Updating section visibility for role:', currentUser.role);
    
    // Hide all sections first
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show sections based on role
    if (currentUser.role === 'admin') {
        document.getElementById('adminDashboard').classList.add('active');
        document.getElementById('payments').classList.add('active');
    } else if (currentUser.role === 'manager') {
        document.getElementById('carManagement').classList.add('active');
    } else if (currentUser.role === 'accountant') {
        document.getElementById('payments').classList.add('active');
    }
}

// Add event listeners
function addEventListeners() {
    document.getElementById('addCarForm')?.addEventListener('submit', addCar);
    document.getElementById('paymentSearchInput')?.addEventListener('input', searchPayments);
    document.getElementById('monthFilter')?.addEventListener('change', searchPayments);
    document.getElementById('statusFilter')?.addEventListener('change', searchPayments);
    document.getElementById('sortBy')?.addEventListener('change', searchPayments);
}

// Update dashboard stats
function updateDashboardStats() {
    try {
        // Update total cars
        document.getElementById('totalCars').textContent = cars.length;

        // Update active rentals
        document.getElementById('activeRentals').textContent = 
            cars.filter(car => car.status === 'rented').length;

        // Update monthly revenue
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const monthlyRevenue = payments
            .filter(p => p.status === 'approved' && p.month === currentMonth)
            .reduce((sum, p) => sum + (parseFloat(p.finalAmount || p.amount) || 0), 0);
        document.getElementById('monthlyRevenue').textContent = '৳' + monthlyRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Update pending payments
        document.getElementById('pendingPayments').textContent = 
            payments.filter(p => p.status === 'pending').length;
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Update car table
function updateCarTable() {
    const tableBody = document.getElementById('carTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = cars.map(car => `
        <tr>
            <td>${car.name}</td>
            <td>${car.number}</td>
            <td>${car.owner}</td>
            <td>${car.mobile}</td>
            <td>${car.gps}</td>
            <td>৳${car.rent}</td>
            <td>
                <span class="badge bg-${car.status === 'active' ? 'success' : 'warning'}">
                    ${car.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editCar('${car.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCar('${car.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update payment table
function updatePaymentTable(filteredPayments = null) {
    console.log('Updating payment table...');
    
    const tableBody = document.getElementById('paymentTableBody');
    if (!tableBody) {
        console.error('Payment table body not found');
        return;
    }

    // Get payments to show
    let paymentsToShow = filteredPayments || payments;
    console.log('Total payments:', paymentsToShow.length);

    // Clear table
    tableBody.innerHTML = '';

    // Create table rows
    paymentsToShow.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.carNumber}</td>
            <td>${payment.carModel}</td>
            <td>${payment.ownerName}</td>
            <td>${payment.month}</td>
            <td>৳${payment.amount}</td>
            <td>${payment.dueDate}</td>
            <td>
                <span class="badge bg-${payment.status === 'approved' ? 'success' : 'warning'}">
                    ${payment.status}
                </span>
            </td>
            <td>
                ${payment.status === 'pending' ? `
                    <button class="btn btn-sm btn-success me-1" onclick="approvePayment('${payment.id}')">
                        <i class="bi bi-check-circle"></i> Approve
                    </button>
                ` : `
                    <button class="btn btn-sm btn-primary me-1" onclick="viewInvoice('${payment.id}')">
                        <i class="bi bi-file-text"></i> Invoice
                    </button>
                `}
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update payment stats
    const pendingCount = paymentsToShow.filter(p => p.status === 'pending').length;
    const approvedCount = paymentsToShow.filter(p => p.status === 'approved').length;
    const totalAmount = paymentsToShow.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Current month payments
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const currentMonthAmount = paymentsToShow
        .filter(p => p.month === currentMonth)
        .reduce((sum, p) => sum + Number(p.amount), 0);

    // Update stats display
    document.getElementById('pendingPaymentsCount').textContent = pendingCount;
    document.getElementById('approvedPaymentsCount').textContent = approvedCount;
    document.getElementById('totalPaymentAmount').textContent = '৳' + totalAmount;
    document.getElementById('currentMonthAmount').textContent = '৳' + currentMonthAmount;
}

// Initialize payment filters
function initializePaymentFilters() {
    const monthSelect = document.getElementById('monthFilter');
    const yearSelect = document.getElementById('filterYear');
    const statusSelect = document.getElementById('filterStatus');

    // Only proceed if the elements exist
    if (!monthSelect) {
        console.log('Month filter not found');
        return;
    }

    // Initialize month options if empty
    if (monthSelect && monthSelect.options.length === 0) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        months.forEach((month, index) => {
            const option = new Option(month, String(index + 1).padStart(2, '0'));
            monthSelect.add(option);
        });
        monthSelect.value = String(new Date().getMonth() + 1).padStart(2, '0');
    }

    // Initialize year options if empty
    if (yearSelect && yearSelect.options.length === 0) {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 2; year <= currentYear + 2; year++) {
            yearSelect.add(new Option(year, year));
        }
        yearSelect.value = currentYear;
    }

    // Add event listeners only if elements exist
    [monthSelect, yearSelect, statusSelect].filter(Boolean).forEach(select => {
        select.addEventListener('change', () => {
            const filters = {
                month: monthSelect ? monthSelect.value : '',
                year: yearSelect ? yearSelect.value : '',
                status: statusSelect ? statusSelect.value : ''
            };
            const filteredPayments = payments.filter(payment => {
                if (!payment.month) return true;
                const [paymentYear, paymentMonth] = payment.month.split('-');
                return (
                    (!filters.month || paymentMonth === filters.month) &&
                    (!filters.year || paymentYear === filters.year) &&
                    (!filters.status || payment.status === filters.status)
                );
            });
            updatePaymentTable(filteredPayments);
        });
    });
}

// Add new car
function addCar(event) {
    event.preventDefault();
    
    // Get form data
    const newCar = {
        id: 'car_' + Date.now(),
        name: document.getElementById('carName').value,
        number: document.getElementById('carNumber').value,
        owner: document.getElementById('ownerName').value,
        mobile: document.getElementById('ownerMobile').value,
        gps: document.getElementById('gpsNumber').value || 'N/A',
        rent: document.getElementById('rentAmount').value,
        status: 'active'
    };
    
    // Validate required fields
    if (!newCar.name || !newCar.number || !newCar.owner || !newCar.mobile || !newCar.rent) {
        showNotification('সব তথ্য পূরণ করুন', 'error');
        return;
    }
    
    // Add to cars array
    cars.push(newCar);
    
    // Save to localStorage
    localStorage.setItem('cars', JSON.stringify(cars));
    
    // Create payment record for the new car
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const payment = {
        id: 'payment_' + Date.now() + '_' + newCar.id,
        carNumber: newCar.number,
        carModel: newCar.name,
        ownerName: newCar.owner,
        ownerMobile: newCar.mobile,
        month: currentMonth,
        amount: newCar.rent,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        status: 'pending',
        createdBy: currentUser.username,
        createdAt: new Date().toISOString()
    };
    
    // Get existing payments
    let payments = JSON.parse(localStorage.getItem('payments') || '[]');
    
    // Add new payment
    payments.push(payment);
    
    // Save updated payments
    localStorage.setItem('payments', JSON.stringify(payments));
    
    // Reset form
    document.getElementById('addCarForm').reset();
    
    // Update tables
    updateCarTable();
    if (document.getElementById('payments').classList.contains('active')) {
        updatePaymentTable();
    }
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('addCarModal')).hide();
    
    // Show success message
    showNotification('নতুন গাড়ি এবং পেমেন্ট রেকর্ড যোগ করা হয়েছে', 'success');
}

// Edit car
function editCar(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car) {
        showNotification('গাড়ি খুঁজে পাওয়া যায়নি', 'error');
        return;
    }
    
    // Populate edit form
    document.getElementById('editCarId').value = car.id;
    document.getElementById('editCarName').value = car.name;
    document.getElementById('editCarNumber').value = car.number;
    document.getElementById('editOwnerName').value = car.owner;
    document.getElementById('editOwnerMobile').value = car.mobile;
    document.getElementById('editGpsNumber').value = car.gps;
    document.getElementById('editRentAmount').value = car.rent;
    document.getElementById('editCarStatus').value = car.status;
    
    // Show edit modal
    const editModal = new bootstrap.Modal(document.getElementById('editCarModal'));
    editModal.show();
}

// Save edited car
function saveCarEdit(event) {
    event.preventDefault();
    
    const carId = document.getElementById('editCarId').value;
    const carIndex = cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
        showNotification('গাড়ি খুঁজে পাওয়া যায়নি', 'error');
        return;
    }
    
    // Update car data
    cars[carIndex] = {
        id: carId,
        name: document.getElementById('editCarName').value,
        number: document.getElementById('editCarNumber').value,
        owner: document.getElementById('editOwnerName').value,
        mobile: document.getElementById('editOwnerMobile').value,
        gps: document.getElementById('editGpsNumber').value || 'N/A',
        rent: document.getElementById('editRentAmount').value,
        status: document.getElementById('editCarStatus').value
    };
    
    // Save to localStorage
    localStorage.setItem('cars', JSON.stringify(cars));
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('editCarModal')).hide();
    
    // Update table
    updateCarTable();
    
    // Show success message
    showNotification('গাড়ির তথ্য আপডেট করা হয়েছে', 'success');
}

// Delete car
function deleteCar(carId) {
    if (!confirm('আপনি কি নিশ্চিত যে এই গাড়ির তথ্য মুছে ফেলতে চান?')) {
        return;
    }
    
    // Remove car from array
    cars = cars.filter(c => c.id !== carId);
    
    // Save to localStorage
    localStorage.setItem('cars', JSON.stringify(cars));
    
    // Update table
    updateCarTable();
    
    // Show success message
    showNotification('গাড়ির তথ্য মুছে ফেলা হয়েছে', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Helper function to show modals
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

// Helper function to show sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }
}
