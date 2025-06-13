document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const booksTableBody = document.getElementById('books-table-body');

    let allBooks = [];

    const fetchBooks = async () => {
        try {
            // Assuming the CAP service exposes books via /browse/Books
            const response = await fetch('/browse/Books');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allBooks = data.value; // CAP OData services return data in 'value' array
            renderBooks(allBooks);
        } catch (error) {
            console.error('Error fetching books:', error);
            booksTableBody.innerHTML = '<tr><td colspan="5">Failed to load books. Please check the server.</td></tr>';
        }
    };

    const renderBooks = (books) => {
        booksTableBody.innerHTML = ''; // Clear existing rows
        if (books.length === 0) {
            booksTableBody.innerHTML = '<tr><td colspan="5">No books found.</td></tr>';
            return;
        }

        books.forEach(book => {
            const row = document.createElement('tr');
            row.dataset.bookId = book.ID; // Store book ID for potential detail view
            row.innerHTML = `
                <td>${book.title || ''}</td>
                <td>${book.author || ''}</td>
                <td>${book.genre || ''}</td>
                <td>${book.rating || ''}</td>
                <td>${book.price !== undefined ? `$${book.price.toFixed(2)}` : ''}</td>
                <td><button class="add-to-cart-btn" data-book-id="${book.ID}">Add to Cart</button></td>
            `;
            booksTableBody.appendChild(row);
        });
    };

    const filterBooks = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredBooks = allBooks.filter(book => 
            (book.title && book.title.toLowerCase().includes(searchTerm)) ||
            (book.author && book.author.toLowerCase().includes(searchTerm)) ||
            (book.genre && book.genre.toLowerCase().includes(searchTerm))
        );
        renderBooks(filteredBooks);
    };

    searchInput.addEventListener('input', filterBooks);

    // Optional: Add a click listener for rows to show details (currently just an alert)
    booksTableBody.addEventListener('click', async (event) => {
        const row = event.target.closest('tr');
        if (event.target.classList.contains('add-to-cart-btn')) {
            const bookId = event.target.dataset.bookId;
            const button = event.target;
            button.disabled = true; // Disable button while request is processing
            try {
                const response = await fetch('/browse/addToCart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ bookId: parseInt(bookId, 10) })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
                }
                
                alert(data.message || 'Book added to cart successfully!');
            } catch (error) {
                console.error('Error adding to cart:', error);
                alert(`Failed to add book to cart: ${error.message}`);
            } finally {
                button.disabled = false; // Re-enable button after request completes
            }
        } else if (row && row.dataset.bookId) {
            const bookId = row.dataset.bookId;
            const book = allBooks.find(b => b.ID === bookId);
            if (book) {
                alert(`Details for Book: ${book.title}\nAuthor: ${book.author}\nGenre: ${book.genre}\nRating: ${book.rating}\nPrice: $${book.price.toFixed(2)}`);
            } else {
                alert('Book details not found.');
            }
        }
    });

    fetchBooks(); // Initial fetch when the page loads
}); 