const cds = require('@sap/cds');
const { SELECT, INSERT, UPDATE } = cds.ql;

module.exports = cds.service.impl(async function () {
  const { Books, Carts, CartItems } = this.entities;

  console.log('--> Entities available in service:', this.entities);

  this.on('addToCart', async (req) => {
    const { bookId } = req.data;
    const tx = cds.transaction(req);

    // 1. Check if the book exists and has stock
    const book = await tx.run(
      SELECT.from(Books)
        .where({ ID: bookId })
        .columns('ID', 'title', 'price', 'stock')
    );

    if (!book[0]) {
      return req.error(404, `Book with ID ${bookId} not found.`);
    }

    if (book[0].stock <= 0) {
      return req.error(400, `Book "${book[0].title}" is out of stock.`);
    }

    // 2. Get or create cart
    let cart = await tx.run(
      SELECT.from(Carts)
        .where({ ID: { like: '%' } }) // Get any cart for now
        .limit(1)
    );

    if (!cart[0]) {
      const newCartId = cds.utils.uuid().toString();
      await tx.run(
        INSERT.into(Carts).entries({
          ID: newCartId
        })
      );
      // After inserting, re-query to ensure 'cart' has the correct structure and ID
      cart = await tx.run(SELECT.from(Carts).where({ ID: newCartId }));
    }

    const cartId = cart[0].ID;
    console.log(`DEBUG: cartId = ${cartId}, type = ${typeof cartId}`); // Debug log
    console.log(`DEBUG: bookId = ${bookId}, type = ${typeof bookId}`); // Debug log

    // 3. Check if book is already in cart
    const existingItem = await tx.run(
      SELECT.from(CartItems)
        .where({ 'cart.ID': cartId, 'book.ID': bookId }) // Use association.ID
    );

    if (existingItem[0]) {
      // Update quantity if book is already in cart
      await tx.run(
        UPDATE(CartItems)
          .set({ quantity: { '+=': 1 } })
          .where({ ID: existingItem[0].ID }) // Update by the synthetic ID
      );
    } else {
      // Add new item to cart
      await tx.run(
        INSERT.into(CartItems).entries({
          ID: cds.utils.uuid().toString(), // Generate new UUID for the synthetic ID
          cart_ID: cartId,
          book_ID: bookId,
          quantity: 1,
          price: book[0].price
        })
      );
    }

    return `Book "${book[0].title}" added to cart successfully.`;
  });

  this.on('submitOrder', async (req) => {
    console.log('--> submitOrder initiated with data:', req.data);
    const { book, quantity } = req.data;

    const tx = cds.transaction(req);
    const bookData = await tx.run(
      SELECT.from(this.entities.Books).where({ ID: book })
    );

    if (!bookData[0]) {
      console.log('--> Book not found:', book);
      return req.error(404, `Book with ID ${book} not found.`);
    }

    if (bookData[0].stock < quantity) {
      console.log('--> Insufficient stock: current=', bookData[0].stock, 'requested=', quantity);
      return req.error(400, `Insufficient stock. Only ${bookData[0].stock} left.`);
    }

    await tx.run(
      UPDATE(this.entities.Books)
        .set({ stock: { '-=': quantity } })
        .where({ ID: book })
    );

    const successMessage = `Order placed: ${quantity} units of "${bookData[0].title}"`;
    console.log('--> Order processing successful, replying with:', successMessage);
    req.reply({ message: successMessage });
  });
});
