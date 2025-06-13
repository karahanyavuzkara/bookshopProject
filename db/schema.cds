using { Currency, managed, sap } from '@sap/cds/common';
namespace sap.capire.bookshop; 

entity Books : managed { 
  key ID : Integer;
  title  : localized String(111);
  descr  : localized String(1111);
  author : Association to Authors;
  genre  : Association to Genres;
  stock  : Integer;
  rating : Decimal(2,1);
  price  : Decimal(9,2);
  currency : Currency;
}

entity Authors : managed { 
  key ID : Integer;
  name   : String(111);
  books  : Association to many Books on books.author = $self;
}

/** Hierarchically organized Code List for Genres */
entity Genres : sap.common.CodeList { 
  key ID   : Integer;
  parent   : Association to Genres;
  children : Composition of many Genres on children.parent = $self;
}

entity Carts : managed {
  key ID     : String(36);
  items      : Composition of many CartItems on items.cart = $self;
}

entity CartItems : managed {
  key ID       : UUID;
  cart_ID    : String(36);
  book_ID    : Integer;
  cart       : Association to Carts on cart.ID = cart_ID;
  book       : Association to Books on book.ID = book_ID;
  quantity   : Integer;
}