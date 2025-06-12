const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {
  const { Books } = this.entities;

  this.on('submitOrder', async (req) => {
    const { book, quantity } = req.data;

    const tx = cds.transaction(req);
    const bookData = await tx.run(
      SELECT.from(Books).where({ ID: book })
    );

    if (!bookData[0]) {
      return req.error(404, `Book with ID ${book} not found.`);
    }

    if (bookData[0].stock < quantity) {
      return req.error(400, `Insufficient stock. Only ${bookData[0].stock} left.`);
    }

    await tx.run(
      UPDATE(Books)
        .set({ stock: { '-=': quantity } })
        .where({ ID: book })
    );

    return { message: `Order placed: ${quantity} units of "${bookData[0].title}"` };
  });
});
