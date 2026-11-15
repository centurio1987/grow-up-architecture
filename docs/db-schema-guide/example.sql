-- PostgreSQL 18 teaching example. DDL is not the full enforcement layer.
-- Assumptions: KRW only; no tax/discount/shipping fee; orders immutable
-- after placement except for state. No payment or stock subsystem here.
CREATE TABLE customer (
  customer_id bigint PRIMARY KEY,
  display_name text NOT NULL
);
CREATE TABLE product (
  product_id bigint PRIMARY KEY,
  name text NOT NULL,
  current_price_krw bigint NOT NULL CHECK (current_price_krw >= 0),
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE sales_order (
  order_id bigint PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customer(customer_id),
  request_key text NOT NULL,
  request_fingerprint text NOT NULL,
  placed_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('placed','confirmed','cancelled')),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  postal_code text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  UNIQUE (customer_id, request_key)
);
CREATE TABLE order_item (
  order_id bigint NOT NULL REFERENCES sales_order(order_id),
  line_no integer NOT NULL CHECK (line_no > 0),
  product_id bigint NOT NULL REFERENCES product(product_id),
  product_name_at_order text NOT NULL,
  unit_price_krw bigint NOT NULL CHECK (unit_price_krw >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, line_no)
);
CREATE TABLE order_status_history (
  order_id bigint NOT NULL REFERENCES sales_order(order_id),
  seq bigint NOT NULL CHECK (seq > 0),
  from_status text CHECK (from_status IN ('placed','confirmed','cancelled')),
  to_status text NOT NULL CHECK (to_status IN ('placed','confirmed','cancelled')),
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_ref text NOT NULL,
  reason text NOT NULL,
  PRIMARY KEY (order_id, seq),
  CHECK (
    (seq = 1 AND from_status IS NULL AND to_status = 'placed')
    OR
    (seq > 1 AND from_status IS NOT NULL AND (
      (from_status = 'placed' AND to_status IN ('confirmed','cancelled'))
      OR (from_status = 'confirmed' AND to_status = 'cancelled')
    ))
  )
);
CREATE INDEX order_customer_recent
  ON sales_order (customer_id, placed_at DESC, order_id DESC);
CREATE INDEX order_item_product ON order_item (product_id);

-- Authoritative facts are order items, not current product prices.
CREATE VIEW order_total AS
SELECT order_id, SUM(unit_price_krw::numeric * quantity) AS total_krw
FROM order_item GROUP BY order_id;

BEGIN;
INSERT INTO customer VALUES (7, '고객 A');
INSERT INTO product VALUES (10, '노트', 12000, true);
INSERT INTO sales_order VALUES
 (1001, 7, 'req-001', 'example-canonical-request-v1',
  '2026-09-22T10:00:00+09:00', 'placed', 1,
  '수령인 A', '010-0000-0000', '00000', '예시시 예시로 1', '101호');
INSERT INTO order_item VALUES (1001, 1, 10, '노트', 12000, 2);
INSERT INTO order_status_history
 (order_id, seq, from_status, to_status, occurred_at, actor_ref, reason)
 VALUES (1001, 1, NULL, 'placed', '2026-09-22T10:00:00+09:00',
         'customer:7', '주문 접수');
COMMIT;

UPDATE product SET current_price_krw = 15000 WHERE product_id = 10;
SELECT total_krw FROM order_total WHERE order_id = 1001; -- 24000

-- Requires application transaction or stored procedure:
-- * server-validated price, nonempty item list, immutable order contents;
-- * compare request fingerprint on idempotent retries;
-- * serialize status transitions with a version predicate or row lock;
-- * update state and append contiguous history atomically;
-- * deny independent DML that could bypass these rules;
-- * implement an approved retention/redaction policy before production.
