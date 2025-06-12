document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
});

async function fetchBooks() {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = ''; // Clear loading message

    try {
        const response = await fetch('/browse/Books'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            const books = await response.json();

            if (books.value && books.value.length > 0) {
                books.value.forEach(book => {
                    const bookCard = document.createElement('div');
                    bookCard.classList.add('book-card');
                    bookCard.innerHTML = `
                        <h3>${book.title}</h3>
                        <p>Author: ${book.author || 'Unknown'}</p>
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
        bookList.innerHTML = '<p>Failed to load books. Please ensure the backend is running.</p>';
    }
}

async function handleAddToCart(event) {
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

        const responseText = await response.text();

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}. Raw response: ${responseText}`;
            try {
                const errorJson = JSON.parse(responseText);
                errorMessage = errorJson.error ? errorJson.error.message : responseText;
            } catch (e) {
                // If not JSON, use the raw text
            }
            throw new Error(`Failed to add to cart: ${errorMessage}`);
        } else {
            // If response is OK, try to parse JSON from the raw text
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                // This catch block will now definitively show us the raw content
                throw new Error(`Failed to parse JSON response: ${e.message}. Raw response received: '${responseText}'`);
            }
            
            console.log('Book added to cart successfully:', result.message);
            alert(`Added to cart: ${result.message}`);

            fetchBooks(); // Re-fetch books to update stock display
        }

    } catch (error) {
        console.error('Error adding to cart:', error);
        alert(`Error adding to cart: ${error.message}`);
    }
} 