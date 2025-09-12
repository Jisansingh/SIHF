// Utility function to determine score class
function getScoreClass(score) {
    if (!score) return 'low-score';
    const value = parseInt(score);
    if (value >= 80) return 'high-score';
    if (value >= 50) return 'medium-score';
    return 'low-score';
}

// Render summary statistics
function renderSummary(summary) {
    const summaryHTML = `
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-box"></i>
            </div>
            <div class="stat-content">
                <h3>Total Products</h3>
                <div class="value">${summary.total_products}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--success-color)">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
                <h3>Compliant Products</h3>
                <div class="value">${summary.compliant}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--danger-color)">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="stat-content">
                <h3>Non-Compliant</h3>
                <div class="value">${summary.non_compliant}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: #2563eb">
                <i class="fas fa-indian-rupee-sign"></i>
            </div>
            <div class="stat-content">
                <h3>Total Value</h3>
                <div class="value">${summary.total_value}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--warning-color)">
                <i class="fas fa-chart-pie"></i>
            </div>
            <div class="stat-content">
                <h3>Average Compliance</h3>
                <div class="value">${summary.average_compliance}</div>
            </div>
        </div>
    `;
    document.getElementById("summary").innerHTML = summaryHTML;
}

// Render product cards
function renderProducts(products) {
    const container = document.getElementById("products");
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>No products found matching your criteria</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card ${product.compliance_class}">
            <div class="product-header">
                <h3 class="product-title">${product.title || 'Unnamed Product'}</h3>
                <span class="product-category">${product.category || 'Other'}</span>
            </div>
            <div class="product-price">${product.price || 'Price not available'}</div>
            <div class="product-details">
                <div class="detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span class="expiry-status ${product.expiry_status?.toLowerCase()}">
                        ${product.expiry || 'Missing'}
                    </span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-weight-hanging"></i>
                    <span>${product.weight || 'Missing'}</span>
                </div>
                <div class="compliance-status ${product.compliance_class}">
                    <i class="fas ${product.issues === 'OK' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                    <span class="score">${parseInt(product.accuracy)}% Compliant</span>
                    ${product.issues !== 'OK' ? `<span class="issues">${product.issues}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Render charts using Chart.js
function renderCharts(stats) {
    try {
        // Clear previous charts if they exist
        const existingCharts = Chart.getChart("complianceChart");
        if (existingCharts) existingCharts.destroy();
        const existingIssuesChart = Chart.getChart("issuesChart");
        if (existingIssuesChart) existingIssuesChart.destroy();

        if (!stats || (!stats.compliance_distribution && !stats.top_issues)) {
            console.error('No chart data available');
            return;
        }

        // Compliance Distribution Chart
        const complianceCtx = document.getElementById("complianceChart");
        if (complianceCtx && stats.compliance_distribution) {
            const ctx = complianceCtx.getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(stats.compliance_distribution),
                    datasets: [{
                        data: Object.values(stats.compliance_distribution),
                        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Compliance Distribution',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        }
                    }
                }
            });
        }

        // Top Issues Chart
        const issuesCtx = document.getElementById("issuesChart");
        if (issuesCtx && stats.top_issues) {
            const ctx = issuesCtx.getContext('2d');
            const issuesLabels = Object.keys(stats.top_issues);
            const issuesValues = Object.values(stats.top_issues);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: issuesLabels,
                    datasets: [{
                        label: 'Number of Products',
                        data: issuesValues,
                        backgroundColor: '#2563eb',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Top Issues',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 12
                                },
                                autoSkip: false,
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error rendering charts:', error);
        const chartContainers = document.querySelectorAll('.chart');
        chartContainers.forEach(container => {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-chart-bar"></i>
                    <p>Failed to load chart</p>
                </div>
            `;
        });
    }
}

// Setup and handle filters
function setupFilters(products) {
    const searchInput = document.getElementById("search");
    const complianceButtons = document.querySelectorAll(".filter-btn");
    
    // Setup category filters
    const categories = [...new Set(products.map(p => p.category))].sort();
    const categoryFiltersContainer = document.getElementById("category-filters");
    categoryFiltersContainer.innerHTML = `
        <button class="filter-btn active" data-category="all">All Categories</button>
        ${categories.map(cat => `
            <button class="filter-btn" data-category="${cat}">${cat}</button>
        `).join('')}
    `;

    let currentComplianceFilter = "all";
    let currentCategoryFilter = "all";

    function applyFilters() {
        let filtered = products;
        
        // Apply compliance filter
        if (currentComplianceFilter !== "all") {
            filtered = filtered.filter(p => p.compliance_class === currentComplianceFilter);
        }
        
        // Apply category filter
        if (currentCategoryFilter !== "all") {
            filtered = filtered.filter(p => p.category === currentCategoryFilter);
        }
        
        // Apply search filter
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(searchTerm) || 
                p.issues.toLowerCase().includes(searchTerm)
            );
        }
        
        renderProducts(filtered);
    }

    // Search functionality
    searchInput.addEventListener("input", applyFilters);

    // Compliance filter buttons
    complianceButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const filter = btn.dataset.filter;
            currentComplianceFilter = filter;
            
            // Update active button
            complianceButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            applyFilters();
        });
    });

    // Category filter buttons
    const categoryButtons = categoryFiltersContainer.querySelectorAll(".filter-btn");
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const category = btn.dataset.category;
            currentCategoryFilter = category;
            
            // Update active button
            categoryButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            applyFilters();
        });
    });
}

// Render analytics charts
function renderAnalyticsCharts(stats) {
    // Clear any existing charts
    ['complianceChart', 'issuesChart', 'categoryChart', 'priceChart'].forEach(id => {
        const existingChart = Chart.getChart(id);
        if (existingChart) {
            existingChart.destroy();
        }
    });

    // Compliance Distribution Chart
    const complianceCtx = document.getElementById('complianceChart').getContext('2d');
    new Chart(complianceCtx, {
        type: 'doughnut',
        data: {
            labels: ['Compliant', 'Partial', 'Non-Compliant'],
            datasets: [{
                data: [
                    stats.compliance_distribution.Compliant || 0,
                    stats.compliance_distribution.Partial || 0,
                    stats.compliance_distribution['Non-Compliant'] || 0
                ],
                backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // Top Issues Chart
    if (stats.top_issues && Object.keys(stats.top_issues).length > 0) {
        const issuesCtx = document.getElementById('issuesChart').getContext('2d');
        new Chart(issuesCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(stats.top_issues),
                datasets: [{
                    label: 'Number of Products',
                    data: Object.values(stats.top_issues),
                    backgroundColor: '#2563eb',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    // Category Distribution Chart
    if (stats.category_distribution && Object.keys(stats.category_distribution).length > 0) {
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(stats.category_distribution),
                datasets: [{
                    data: Object.values(stats.category_distribution),
                    backgroundColor: [
                        '#4CAF50', '#2196F3', '#FFC107', '#E91E63', 
                        '#9C27B0', '#00BCD4', '#FF5722', '#795548'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    // Price Range Analysis Chart
    if (stats.price_ranges && Object.keys(stats.price_ranges).length > 0) {
        const priceCtx = document.getElementById('priceChart').getContext('2d');
        new Chart(priceCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(stats.price_ranges),
                datasets: [{
                    label: 'Number of Products',
                    data: Object.values(stats.price_ranges),
                    backgroundColor: '#6366F1',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
}

// Main function to load and display data
async function loadProducts() {
    const productsContainer = document.getElementById('products');
    
    try {
        // Show loading state
        productsContainer.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading products...</p>
            </div>
        `;

        // Load data sequentially to handle errors better
        const productsResponse = await fetch("/api/products");
        if (!productsResponse.ok) {
            const errorData = await productsResponse.json();
            throw new Error(errorData.error || 'Failed to fetch products');
        }
        const products = await productsResponse.json();
        
        if (!Array.isArray(products) || !products.length) {
            throw new Error('No products available');
        }

        const summaryResponse = await fetch("/api/compliance-summary");
        if (!summaryResponse.ok) {
            throw new Error('Failed to fetch summary data');
        }
        const summary = await summaryResponse.json();

        const statsResponse = await fetch("/api/stats");
        if (!statsResponse.ok) {
            throw new Error('Failed to fetch statistics');
        }
        const stats = await statsResponse.json();

        // Clear loading message
        productsContainer.innerHTML = '';

        // Render everything
        renderSummary(summary);
        renderCharts(stats);
        renderProducts(products);
        setupFilters(products);

    } catch (error) {
        console.error("Error loading data:", error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load products</p>
                <p class="error-details">${error.message}</p>
                <button onclick="loadProducts()" class="retry-button">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Handle navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    const mainContent = document.querySelector('.main-content');
    const defaultContent = mainContent.innerHTML;

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const section = link.querySelector('span').textContent.toLowerCase();
            
            switch(section) {
                case 'dashboard':
                    mainContent.innerHTML = defaultContent;
                    loadProducts();
                    break;
                case 'analytics':
                    alert('Analytics feature coming soon!');
                    link.classList.remove('active');
                    navLinks[0].classList.add('active');
                    break;
                case 'settings':
                    alert('Settings feature coming soon!');
                    link.classList.remove('active');
                    navLinks[0].classList.add('active');
                    break;
            }
        });
    });
}

// No analytics view for now
// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupNavigation();
});
