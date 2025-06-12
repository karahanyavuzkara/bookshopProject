document.addEventListener('DOMContentLoaded', () => {
    fetchBooks(); // Attempt to fetch books initially, might fail if not logged in
    const loginButton = document.getElementById('login-btn');
    loginButton.addEventListener('click', handleLogin);
});

let isAuthenticated = false; // Simple flag for demonstration

async function handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');
    const loginSection = document.getElementById('login-section');

    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username || !password) {
        loginMessage.textContent = 'Please enter both username and password.';
        loginMessage.style.color = 'red';
        return;
    }

    // Encode credentials for Basic Authentication
    const credentials = btoa(`${username}:${password}`);

    try {
        // Test authentication by fetching a protected resource (e.g., Books)
        // The browser will automatically send the Basic Auth header for subsequent requests
        // to the same origin once it's successfully authenticated.
        const response = await fetch('/browse/Books', {
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (response.ok) {
            isAuthenticated = true;
            loginMessage.textContent = 'Login successful!';
            loginMessage.style.color = 'green';
            loginSection.style.display = 'none'; // Hide login section on success
            fetchBooks(); // Re-fetch books after successful login
        } else {
            isAuthenticated = false;
            loginMessage.textContent = 'Login failed. Please check your credentials.';
            loginMessage.style.color = 'red';
            console.error('Login failed with status:', response.status);
        }
    } catch (error) {
        isAuthenticated = false;
        loginMessage.textContent = 'An error occurred during login.';
        loginMessage.style.color = 'red';
        console.error('Error during login:', error);
    }
}

async function fetchBooks() {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = ''; // Clear loading message

    try {
        const response = await fetch('/browse/Books'); 
        if (!response.ok) {
            // If not authenticated, the initial fetch might fail, 
            // but we'll handle it by showing the login form.
            if (response.status === 401) {
                bookList.innerHTML = '<p>Please login to view books.</p>';
                document.getElementById('login-section').style.display = 'block';
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            const books = await response.json();

            if (books.value && books.value.length > 0) {
                books.value.forEach(book => {
                    const bookCard = document.createElement('div');
                    bookCard.classList.add('book-card');
                    bookCard.innerHTML = `
                        <h3>${book.title}</h3>
                        <p>Author: ${book.author_name || 'Unknown'}</p>
                        <p class="price">Price: $${book.price}</p>
                        <button class="add-to-cart-btn" data-book-id="${book.ID}">Add to Cart</button>
                    `;
                    bookList.appendChild(bookCard);
                });
                document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                    button.addEventListener('click', handleAddToCart);
                });
            } else {
                bookList.innerHTML = '<p>No books found.</p>';
            }
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        bookList.innerHTML = '<p>Failed to load books. Please ensure the backend is running and you are logged in.</p>';
    }
}

async function handleAddToCart(event) {
    if (!isAuthenticated) {
        alert('Please log in to add items to cart.');
        document.getElementById('login-section').style.display = 'block';
        return;
    }

    const bookId = event.target.dataset.bookId;
    const quantity = 1; // Assuming adding one book at a time

    try {
        const response = await fetch('/browse/submitOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                book: bookId,
                quantity: quantity
            })
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMessage = result.error ? result.error.message : 'Unknown error';
            throw new Error(`Failed to add to cart: ${errorMessage}`);
        }

        console.log('Book added to cart successfully:', result.message);
        alert(`Added to cart: ${result.message}`);

        fetchBooks(); // Re-fetch books to update stock display

    } catch (error) {
        console.error('Error adding to cart:', error);
        alert(`Error adding to cart: ${error.message}`);
    }
} 