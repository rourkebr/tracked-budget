let db;
// establish a connection to IndexedDB database called 'tracking-budgets' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the databse version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called `transaction` (ref index.html in browser), set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function(event) {
    // when db is successfully created with it's object store (from onupgradeneeded event above) or simply establish a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.online) {
        // we haven't created this yet, but we will soon, so loet's comment it out for now
        uploadTransaction();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['transaction'], 'readwrite');

    // access the object store for `transaction`
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add record
    budgetObjectStore.add(record);
};

function uploadTransaction() {
    // open a transaction on you db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // get all records from the store and set to a variable 
    const getAll = budgetObjectStore.getAll();

    // on a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in the indexedDB's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
               method: 'POST',
               body: JSON.stringify(getAll.result),
               headers: {
                   Accept: 'application/json, text/plain, */*',
                   'Content-Type': 'application/json'
               } 
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access the transaction object store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear all items in your store
               budgetObjectStore.clear();

                alert('All saved transactions have been submitted.');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

// listen for app coming back online
window.addEventListener('online', uploadTransaction);