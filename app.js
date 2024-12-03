const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const readline = require("readline");

const app = express();
app.use(bodyParser.json());

let expenses = [];
const categories = ["Food", "Travel", "Shopping", "Bills", "Other"];
const validateExpense = (expense) => {
    const { category, amount, date } = expense;
    if (!categories.includes(category)) return "Invalid category.";
    if (amount <= 0) return "Amount must be positive.";
    if (isNaN(Date.parse(date))) return "Invalid date.";
    return null;
};

app.get("/", (req, res) => {
    const message = "Welcome to the Personal Expense Tracker API!";
    console.log(message);
    res.send(message);
});
app.post("/expenses", (req, res) => {
    const { category, amount, date } = req.body;
    const error = validateExpense({ category, amount, date });
    if (error) {
        return res.status(400).json({ status: "error", error });
    }
    expenses.push({ category, amount, date: new Date(date) });
    res.json({ status: "success", data: "Expense added successfully." });
});
app.get("/expenses", (req, res) => {
    const { category, startDate, endDate } = req.query;
    let filteredExpenses = expenses;
    if (category) {
        filteredExpenses = filteredExpenses.filter(
            (expense) => expense.category === category
        );
    }
    if (startDate || endDate) {
        filteredExpenses = filteredExpenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            if (startDate && expenseDate < new Date(startDate)) return false;
            if (endDate && expenseDate > new Date(endDate)) return false;
            return true;
        });
    }
    res.json({ status: "success", data: filteredExpenses });
});
app.get("/expenses/monthly-report", (req, res) => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30); 
    console.log("Current Date: " + now.toISOString().split("T")[0]);
    console.log("30 Days Ago: " + oneMonthAgo.toISOString().split("T")[0]);
    const monthlyExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        console.log(`Checking expense date: ${expenseDate.toISOString().split("T")[0]}`);
        return expenseDate >= oneMonthAgo && expenseDate <= now;
    });
    if (monthlyExpenses.length === 0) {
        return res.json({
            status: "success",
            data: "No expenses recorded for the past month.",
        });
    }
    const categoryTotals = monthlyExpenses.reduce((totals, expense) => {
        if (!totals[expense.category]) totals[expense.category] = 0;
        totals[expense.category] += expense.amount;
        return totals;
    }, {});
    const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const highestSpendingCategory = Object.keys(categoryTotals).reduce(
        (highest, category) =>
            categoryTotals[category] > (categoryTotals[highest] || 0)
                ? category
                : highest,
        ""
    );
    res.json({
        status: "success",
        data: {
            highestSpendingCategory,
            totalSpent, 
            categoryTotals,
        },
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    const message = "Welcome to the Personal Expense Tracker API!";
    console.log(message);
    console.log(`Server running on http://localhost:${PORT}`);
    startTerminalInput(); 
});
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function startTerminalInput() {
    console.log("\n--- Personal Expense Tracker CLI ---");
    console.log("1. Add an expense");
    console.log("2. View all expenses");
    console.log("3. Generate monthly report"); 
    console.log("4. Exit\n");
    rl.question("Choose an option (1-4): ", (choice) => {
        switch (choice) {
            case "1":
                addExpense();
                break;
            case "2":
                viewExpenses();
                break;
            case "3":
                generateMonthlyReport(); 
                break;
            case "4":
                console.log("Exiting... Goodbye!");
                rl.close();
                process.exit(0);
                break;
            default:
                console.log("Invalid option. Please try again.");
                startTerminalInput();
        }
    });
}

function addExpense() {
    rl.question("Enter category (Food, Travel, Shopping, Bills, Other): ", (category) => {
        if (!categories.includes(category)) {
            console.log("Invalid category. Try again.");
            return startTerminalInput();
        }
        rl.question("Enter amount: ", (amount) => {
            amount = parseFloat(amount);
            if (isNaN(amount) || amount <= 0) {
                console.log("Invalid amount. Try again.");
                return startTerminalInput();
            }
            rl.question("Enter date (YYYY-MM-DD): ", (date) => {
                if (isNaN(Date.parse(date))) {
                    console.log("Invalid date. Try again.");
                    return startTerminalInput();
                }
                expenses.push({ category, amount, date: new Date(date) });
                console.log("Expense added successfully!");
                startTerminalInput();
            });
        });
    });
}

function viewExpenses() {
    console.log("\n--- All Expenses ---");
    expenses.forEach((expense, index) => {
        console.log(
            `${index + 1}. Category: ${expense.category}, Amount: ${expense.amount}, Date: ${expense.date.toISOString().split("T")[0]}`
        );
    });
    startTerminalInput();
}
function generateMonthlyReport() {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30); 
    console.log("Current Date: " + now.toISOString().split("T")[0]);
    console.log("30 Days Ago: " + oneMonthAgo.toISOString().split("T")[0]);
    const monthlyExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        console.log(`Checking expense date: ${expenseDate.toISOString().split("T")[0]}`);
        return expenseDate >= oneMonthAgo && expenseDate <= now;
    });
    if (monthlyExpenses.length === 0) {
        console.log("\n--- Monthly Report ---");
        console.log("No expenses recorded for the past month.");
        return startTerminalInput();
    }
    const categoryTotals = monthlyExpenses.reduce((totals, expense) => {
        if (!totals[expense.category]) totals[expense.category] = 0;
        totals[expense.category] += expense.amount;
        return totals;
    }, {});
    const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const highestSpendingCategory = Object.keys(categoryTotals).reduce(
        (highest, category) =>
            categoryTotals[category] > (categoryTotals[highest] || 0)
                ? category
                : highest,
        ""
    );
    console.log("\n--- Monthly Report ---");
    console.log(`Highest Spending Category: ${highestSpendingCategory}`);
    console.log(`Total Amount Spent in the Last 30 Days: ${totalSpent}`);
    console.log("Category Totals:", categoryTotals);
    startTerminalInput();
}
