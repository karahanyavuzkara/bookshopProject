const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {
  const { Books } = this.entities;

  this.on('submitOrder', async (req) => {
    console.log('Received submitOrder request:', req.data);

    const { book, quantity } = req.data;

    const tx = cds.transaction(req);
    const bookData = await tx.run(
      SELECT.from(Books).where({ ID: book })
    );

    if (!bookData[0]) {
      console.log('Book not found:', book);
      return req.error(404, `Book with ID ${book} not found.`);
    }

    if (bookData[0].stock < quantity) {
      console.log('Insufficient stock:', bookData[0].stock, 'requested:', quantity);
      return req.error(400, `Insufficient stock. Only ${bookData[0].stock} left.`);
    }

    await tx.run(
      UPDATE(Books)
        .set({ stock: { '-=': quantity } })
        .where({ ID: book })
    );

    console.log('Order placed successfully for book:', bookData[0].title);
    return { message: `Order placed: ${quantity} units of "${bookData[0].title}"` };
  });
});
