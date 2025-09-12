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
            <h3>Total Products</h3>
            <div class="value">${summary.total_products}</div>
        </div>
        <div class="stat-card">
            <h3>Compliant Products</h3>
            <div class="value">${summary.compliant}</div>
        </div>
        <div class="stat-card">
            <h3>Non-Compliant</h3>
            <div class="value">${summary.non_compliant}</div>
        </div>
        <div class="stat-card">
            <h3>Total Value</h3>
            <div class="value">${summary.total_value}</div>
        </div>
        <div class="stat-card">
            <h3>Average Compliance</h3>
            <div class="value">${summary.average_compliance}</div>
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
        <div class="card ${product.compliance_class}">
            <div class="product-category">${product.category || 'Other'}</div>
            <h3>${product.title || 'Unnamed Product'}</h3>
            <p class="price">${product.price || 'Price not available'}</p>
            <div class="product-details">
                <div class="detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span class="expiry-status ${product.expiry_status?.toLowerCase()}">
                        Expiry: ${product.expiry || 'Missing'}
                    </span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-weight-hanging"></i>
                    <span>Weight: ${product.weight || 'Missing'}</span>
                </div>
            </div>
            <div class="compliance-section">
                <div class="compliance-score">
                    <div class="score-circle ${getScoreClass(product.accuracy)}">
                        ${parseInt(product.accuracy)}%
                    </div>
                    <span>Compliance Score</span>
                </div>
                ${product.issues !== 'OK' ? 
                    `<div class="issues">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>${product.issues}</span>
                    </div>` : 
                    `<div class="success">
                        <i class="fas fa-check-circle"></i>
                        <span>Fully Compliant</span>
                    </div>`}
            </div>
        </div>
    `).join('');
}

// Render charts using Chart.js
function renderCharts(stats) {
    try {
        // Compliance Distribution Chart
        const complianceCtx = document.getElementById("complianceChart");
        if (complianceCtx) {
            new Chart(complianceCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(stats.compliance_distribution),
                    datasets: [{
                        data: Object.values(stats.compliance_distribution),
                        backgroundColor: ['#22c55e', '#eab308', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Compliance Distribution',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Top Issues Chart
        const issuesCtx = document.getElementById("issuesChart");
        if (issuesCtx) {
            const issuesLabels = Object.keys(stats.top_issues);
            const issuesValues = Object.values(stats.top_issues);
            
            new Chart(issuesCtx, {
                type: 'bar',
                data: {
                    labels: issuesLabels,
                    datasets: [{
                        label: 'Number of Products',
                        data: issuesValues,
                        backgroundColor: '#2563eb'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Top Issues',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
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

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', loadProducts);
