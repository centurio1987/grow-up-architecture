-- Q01: Buyer detail. $1 order UUID, $2 trusted buyer UUID.
-- One SQL statement gives header, items and amount the same statement snapshot.
SELECT o.id AS order_id, o.placed_at, o.state, o.version,
       (o.state = 'PLACED') AS can_cancel,
       SUM(l.quantity::bigint * l.unit_price_krw) AS total_krw,
       jsonb_agg(jsonb_build_object(
         'lineNo',l.line_no,'productId',l.product_id,'productName',l.product_name,
         'quantity',l.quantity,'unitPriceKrw',l.unit_price_krw,
         'lineTotalKrw',l.quantity::bigint*l.unit_price_krw
       ) ORDER BY l.line_no) AS lines
FROM sales_order o JOIN order_line l ON l.order_id=o.id
WHERE o.id=$1 AND o.buyer_id=$2
GROUP BY o.id;

-- Q02: Seller pending page. Application verifies SELLER first.
-- $1 after time or NULL; $2 after id or NULL; both absent or both present.
-- $3 requested limit 1..100. Read limit+1 to decide whether another page exists.
WITH page AS (
 SELECT id, placed_at, version FROM sales_order
 WHERE state='PLACED'
   AND ($1::timestamptz IS NULL OR (placed_at,id)>($1::timestamptz,$2::uuid))
 ORDER BY placed_at,id LIMIT ($3::integer+1)
)
SELECT p.id AS order_id,p.placed_at,p.version,
       SUM(l.quantity::bigint*l.unit_price_krw) AS total_krw,
       jsonb_agg(jsonb_build_object(
         'lineNo',l.line_no,'productId',l.product_id,'productName',l.product_name,
         'quantity',l.quantity,'unitPriceKrw',l.unit_price_krw,
         'lineTotalKrw',l.quantity::bigint*l.unit_price_krw
       ) ORDER BY l.line_no) AS lines
FROM page p JOIN order_line l ON l.order_id=p.id
GROUP BY p.id,p.placed_at,p.version ORDER BY p.placed_at,p.id;
-- Return the first limit rows. If an extra row exists, encode the last RETURNED
-- row's (placed_at,id) as nextCursor. Otherwise nextCursor=null.
-- Driver bigint SUM may be a string: validate the proven bound before Number conversion.

-- W01: Claim creation key inside the same transaction as Order and OrderLine inserts.
-- $1 buyer UUID, $2 request key, $3 canonical SHA-256 lowercase hex, $4 candidate order UUID.
INSERT INTO order_submission(buyer_id,request_key,request_fingerprint,order_id)
VALUES($1,$2,$3,$4)
ON CONFLICT (buyer_id,request_key) DO NOTHING RETURNING order_id;
-- 1 row: claim won, read catalog snapshot, construct Order, insert header + ALL lines, commit.
-- 0 rows: another committed acceptance owns key. Fetch in a NEW statement below.
-- FK is deferred so candidate order may be inserted later within this transaction.

-- W02: In a fresh READ COMMITTED statement after the key claim returned 0 rows.
SELECT request_fingerprint,order_id FROM order_submission
WHERE buyer_id=$1 AND request_key=$2;
-- Fingerprint differs -> 409 and rollback; same -> load historical receipt and commit.
-- No repricing and no second order. Rollback removes a failed fresh claim.

-- W03: Buyer cancellation. $1 order id; $2 trusted buyer; $3 expectedVersion.
UPDATE sales_order SET state='CANCELLED',version=2
WHERE id=$1 AND buyer_id=$2 AND state='PLACED' AND version=$3
RETURNING id,state,version;
-- 1 row -> success. 0 rows -> no success; ownership-filtered read distinguishes 404/409.

-- W04: Seller confirmation. Role checked by application BEFORE this statement.
UPDATE sales_order SET state='CONFIRMED',version=2
WHERE id=$1 AND state='PLACED' AND version=$2
RETURNING id,state,version;
-- 1 row -> success. 0 -> 404 if absent, otherwise 409. Never retry by removing predicates.
