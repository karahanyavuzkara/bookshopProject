document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const booksTableBody = document.getElementById('books-table-body');
    const cartButton = document.getElementById('cart-button');
    const cartModal = document.getElementById('cart-modal');
    const closeButton = document.querySelector('.close-button');
    const cartItemsBody = document.getElementById('cart-items-body');
    const cartCount = document.getElementById('cart-count');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const checkoutButton = document.getElementById('checkout-button');

    let allBooks = [];
    let cartItems = [];

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

    const fetchCartItems = async () => {
        try {
            const response = await fetch('/browse/CartItems');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            cartItems = data.value;
            updateCartCount();
            renderCartItems();
        } catch (error) {
            console.error('Error fetching cart items:', error);
        }
    };

    const updateCartCount = () => {
        cartCount.textContent = cartItems.length;
    };

    const renderCartItems = () => {
        cartItemsBody.innerHTML = '';
        if (cartItems.length === 0) {
            cartItemsBody.innerHTML = '<tr><td colspan="3" class="empty-cart">Your cart is empty</td></tr>';
            cartTotalAmount.textContent = '0.00';
            checkoutButton.disabled = true;
            return;
        }

        let total = 0;
        cartItems.forEach(item => {
            const book = allBooks.find(b => b.ID === item.book_ID);
            if (book) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${book.title}</td>
                    <td>$${book.price.toFixed(2)}</td>
                    <td>
                        <button class="remove-from-cart" data-cart-item-id="${item.ID}">
                            Remove
                        </button>
                    </td>
                `;
                cartItemsBody.appendChild(row);
                total += book.price;
            }
        });

        cartTotalAmount.textContent = total.toFixed(2);
        checkoutButton.disabled = false;
    };

    const removeFromCart = async (cartItemId) => {
        try {
            const response = await fetch(`/browse/CartItems(${cartItemId})`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchCartItems(); // Refresh cart items
        } catch (error) {
            console.error('Error removing item from cart:', error);
            alert('Failed to remove item from cart. Please try again.');
        }
    };

    // Cart Modal Event Listeners
    cartButton.addEventListener('click', () => {
        cartModal.classList.add('show');
        fetchCartItems();
    });

    closeButton.addEventListener('click', () => {
        cartModal.classList.remove('show');
    });

    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.classList.remove('show');
        }
    });

    cartItemsBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('remove-from-cart')) {
            const cartItemId = event.target.dataset.cartItemId;
            await removeFromCart(cartItemId);
        }
    });

    checkoutButton.addEventListener('click', () => {
        // TODO: Implement checkout functionality
        alert('Checkout functionality coming soon!');
    });

    // Modify the existing add to cart functionality to update the cart count
    booksTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const bookId = event.target.dataset.bookId;
            const button = event.target;
            button.disabled = true;
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
                
                await fetchCartItems(); // Update cart after adding item
                alert(data.message || 'Book added to cart successfully!');
            } catch (error) {
                console.error('Error adding to cart:', error);
                alert(`Failed to add book to cart: ${error.message}`);
            } finally {
                button.disabled = false;
            }
        } else if (event.target.closest('tr') && event.target.closest('tr').dataset.bookId) {
            const bookId = event.target.closest('tr').dataset.bookId;
            const book = allBooks.find(b => b.ID === bookId);
            if (book) {
                alert(`Details for Book: ${book.title}\nAuthor: ${book.author}\nGenre: ${book.genre}\nRating: ${book.rating}\nPrice: $${book.price.toFixed(2)}`);
            } else {
                alert('Book details not found.');
            }
        }
    });

    fetchBooks(); // Initial fetch when the page loads
    fetchCartItems(); // Initial cart fetch
}); 