document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("generateInventoryReportButton").addEventListener("click", generateReport);
});

// generate inventory report 
function generateReport() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    console.log(startDate);
    console.log(endDate);

    if (!startDate || !endDate) {
        alert("Please provide both start and end dates.");
        return;
    }

    fetch(`/inventory/logs?startDate=${startDate}&endDate=${endDate}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert("No logs found for the selected date range.");
                return;
            }

            showPopup(data);
        })
        .catch(err => {
            console.error("Error generating report:", err);
        });
}

// show inventory popup 
function showPopup(data) {
    // Remove any existing popup before creating a new one
    const existingPopup = document.getElementById("reportPopup");
    if (existingPopup) {
        existingPopup.remove();
    }
    // Create the popup container + format
    const popup = document.createElement("div");
    popup.id = "reportPopup";
    popup.style.position = "fixed";
    popup.style.top = "10%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, 0)";
    popup.style.zIndex = "1000";
    popup.style.backgroundColor = "white";
    popup.style.border = "1px solid #ccc";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    popup.style.padding = "20px";
    popup.style.width = "80%";
    popup.style.maxWidth = "800px";
    popup.style.overflow = "auto";
    popup.style.maxHeight = "80%";

    // Create the table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    // Add table caption
    const caption = document.createElement("caption");
    caption.textContent = "Medicine Inventory Report";
    caption.style.fontSize = "24px";
    caption.style.fontWeight = "bold";
    caption.style.marginBottom = "10px";
    table.appendChild(caption);

    // Add table headers
    const headers = ["Medicine Name", "Quantity", "Expiration Date", "Action", "Action Date"];
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        th.style.borderBottom = "1px solid #ccc";
        th.style.padding = "10px";
        th.style.textAlign = "left";
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Add table rows for each datapoint
    const tbody = document.createElement("tbody");
    data.forEach(item => {
        const row = document.createElement("tr");

        // Only include relevant fields
        const fields = [
            item.medicineName,
            item.quantity,
            item.expirationDate,
            item.action,
            new Date(item.actionDate).toLocaleString()
        ];

        fields.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            td.style.padding = "10px";
            td.style.borderBottom = "1px solid #eee";
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Add the table to the popup
    popup.appendChild(table);

    // Create a container for the buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "20px";
    buttonContainer.style.textAlign = "right";

    // Add Export to pdf button
    const exportButton = document.createElement("button");
    exportButton.textContent = "Export as PDF";
    //exportButton.className = "open-button"; // Apply the 'open-button' class
    exportButton.className = "green-btn"; // Apply the 'green-btn' class
    exportButton.addEventListener("click", () => exportToPDF(data));
    buttonContainer.appendChild(exportButton);

    // Add Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "cancel-button"; // Apply the 'cancel-button' class
    closeButton.style.marginLeft = "10px";
    closeButton.addEventListener("click", () => {
        popup.remove();
    });
    buttonContainer.appendChild(closeButton);

    // Add the button container to the popup
    popup.appendChild(buttonContainer);

    // Add the popup to the body
    document.body.appendChild(popup);
}

// export inventory report to pdf
function exportToPDF(data) {
    // Access the jsPDF class from the jspdf global object
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text("Medicine Inventory Report", 10, 10);

    // Add table headers and rows
    const headers = [["Medicine Name", "Quantity", "Expiration Date", "Action", "Action Date"]];
    const rows = data.map(item => [
        item.medicineName,
        item.quantity,
        item.expirationDate,
        item.action,
        new Date(item.actionDate).toLocaleString()
    ]);

    // add table to pdf
    doc.autoTable({
        head: headers,
        body: rows,
        startY: 20
    });

    // Save the PDF
    doc.save("inventory_report.pdf");
}

// get information for financial report 
function getFinancialReport() {
    const startDate = document.getElementById("startDateFinancial").value;
    const endDate = document.getElementById("endDateFinancial").value;
    
    if (!startDate || !endDate) {
        alert("Please provide both start and end dates.");
        return;
    }

    fetch(`/financial/reports?startDate=${startDate}&endDate=${endDate}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert("No financial reports found for the selected date range.");
                return;
            }
            showFinancialPopup(data);
        })
        .catch(err => {
            console.error("Error generating financial report:", err);
        });
}

// show financial report popup
function showFinancialPopup(data) {
    // Remove any existing popup before creating a new one
    const existingPopup = document.getElementById("reportPopup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "reportPopup";
    popup.style.position = "fixed";
    popup.style.top = "10%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, 0)";
    popup.style.zIndex = "1000";
    popup.style.backgroundColor = "white";
    popup.style.border = "1px solid #ccc";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    popup.style.padding = "20px";
    popup.style.width = "80%";
    popup.style.maxWidth = "800px";
    popup.style.overflow = "auto";
    popup.style.maxHeight = "80%";

    // Create the table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    // Add table caption
    const caption = document.createElement("caption");
    caption.textContent = "Financial Report";
    caption.style.fontSize = "24px";
    caption.style.fontWeight = "bold";
    caption.style.marginBottom = "10px";
    table.appendChild(caption);

    // Add table headers
    const headers = ["Transaction Date", "Total Amount"];
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        th.style.borderBottom = "1px solid #ccc";
        th.style.padding = "10px";
        th.style.textAlign = "left";
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    console.log(data);

    // Add table rows for each datapoint
    const tbody = document.createElement("tbody");
    data.forEach(item => {
        const row = document.createElement("tr");

        // Include relevant fields from the financial report data
        const fields = [
            new Date(item.transactionDate).toLocaleString(),
            `$${item.totalAmount.toFixed(2)}`
        ];

        fields.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            td.style.padding = "10px";
            td.style.borderBottom = "1px solid #eee";
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Add the table to the popup
    popup.appendChild(table);

    ///////////////////////STATISTICS TABLE///////////////////
    // Create the statistics table
    const tablestats = document.createElement("table");
    tablestats.style.width = "100%";
    tablestats.style.borderCollapse = "collapse";

    // Add table caption
    const captionstats = document.createElement("caption");
    captionstats.textContent = "Financial Report Statistics";
    captionstats.style.fontSize = "24px";
    captionstats.style.fontWeight = "bold";
    captionstats.style.marginBottom = "10px";
    tablestats.appendChild(captionstats);

    // Add table rows
    const tbodyStats = document.createElement("tbody");
    let sum = 0;
    data.forEach(item => {sum += item.totalAmount;});

    statsData = ["Total amount spent", sum, "Average amount per transaction", sum/data.length]
    for (let i =  0; i < 3; i += 2) {
        const row = document.createElement("tr");

        const fields = [
            statsData[i],
            `$${statsData[i+1].toFixed(2)}`
        ];

        fields.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            td.style.padding = "10px";
            td.style.borderBottom = "1px solid #eee";
            row.appendChild(td);
        });

        tbodyStats.appendChild(row);
    }
    tablestats.appendChild(tbodyStats);

    // Add the table to the popup
    popup.appendChild(tablestats);


    // Create a container for the buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "20px";
    buttonContainer.style.textAlign = "right";

    // Add Export button
    const exportButton = document.createElement("button");
    exportButton.textContent = "Export as PDF";
    exportButton.className = "green-btn"; // Apply the 'green-btn' class
    exportButton.addEventListener("click", () => exportFinancialToPDF(data, sum));
    buttonContainer.appendChild(exportButton);

    // Add Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "cancel-button"; // Apply the 'cancel-button' class
    closeButton.style.marginLeft = "10px";
    closeButton.addEventListener("click", () => {
        popup.remove();
    });
    buttonContainer.appendChild(closeButton);

    // Add the button container to the popup
    popup.appendChild(buttonContainer);

    // Add the popup to the body
    document.body.appendChild(popup);
}

// export financial report to pdf 
function exportFinancialToPDF(data, sum) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text("Financial Report", 10, 10);

    // Add table headers and rows
    const headers = [["Transaction Date", "Total Amount"]];
    const rows = data.map(item => [
        new Date(item.transactionDate).toLocaleString(),
        `$${item.totalAmount.toFixed(2)}`,
    ]);

    doc.autoTable({
        head: headers,
        body: rows,
        startY: 20
    });

    const firstTableEndY = doc.lastAutoTable.finalY;

    // Add second table for statistics below the first one
    const secondRows = [
        ["Total amount spent", `$${sum.toFixed(2)}`],
        ["Average amount per transaction", `$${(sum/data.length).toFixed(2)}`]
    ];

    doc.autoTable({
        body: secondRows,
        startY: firstTableEndY + 10  // Add some space below the first table
    });

    // Save the PDF
    doc.save("financial_report.pdf");
}
