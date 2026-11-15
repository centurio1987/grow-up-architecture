-- Generated from a reviewed relational plan + storage policy. PostgreSQL 18.
-- Not a migration. Application-owned rules are listed in the trace.

CREATE TABLE sales_order (
  id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  placed_at timestamptz(3) NOT NULL,
  state text NOT NULL CHECK (state IN ('PLACED','CONFIRMED','CANCELLED')),
  version smallint NOT NULL CHECK (version BETWEEN 1 AND 2),
  PRIMARY KEY (id),
  CHECK ((state = 'PLACED' AND version = 1) OR (state IN ('CONFIRMED','CANCELLED') AND version = 2))
);

CREATE TABLE order_line (
  order_id uuid NOT NULL,
  line_no smallint NOT NULL CHECK (line_no BETWEEN 1 AND 20),
  product_id uuid NOT NULL,
  product_name varchar(100) NOT NULL CHECK (char_length(product_name) BETWEEN 1 AND 100),
  quantity smallint NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  unit_price_krw integer NOT NULL CHECK (unit_price_krw BETWEEN 0 AND 1000000),
  offer_revision varchar(100) NOT NULL CHECK (offer_revision ~ '^[A-Za-z0-9._-]{1,100}$'),
  PRIMARY KEY (order_id, line_no),
  UNIQUE (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES sales_order (id)
);

CREATE TABLE order_submission (
  buyer_id uuid NOT NULL,
  request_key uuid NOT NULL,
  request_fingerprint char(64) NOT NULL CHECK (request_fingerprint ~ '^[a-f0-9]{64}$'),
  order_id uuid NOT NULL,
  PRIMARY KEY (buyer_id, request_key),
  UNIQUE (order_id),
  FOREIGN KEY (order_id) REFERENCES sales_order (id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX pending_orders_idx ON sales_order (placed_at, id) WHERE state = 'PLACED';
