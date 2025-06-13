using { sap.capire.bookshop as my } from '../db/schema';
service CatalogService @(path:'/browse') { 

  @readonly entity Books as select from my.Books {*,
    author.name as author
  } excluding { createdBy, modifiedBy };

  @readonly entity Carts as select from my.Carts;
  entity CartItems as projection on my.CartItems;

  action submitOrder (book: Books:ID, quantity: Integer);
  action addToCart(bookId: Integer) returns String;
}