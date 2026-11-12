ALTER TABLE orders ADD COLUMN stock_status varchar(16) NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
CREATE TABLE stock_reservations (order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity integer NOT NULL CHECK(quantity>0), expires_at timestamptz NOT NULL, PRIMARY KEY(order_id,product_id));
--> statement-breakpoint
CREATE INDEX stock_reservations_product_expiry ON stock_reservations(product_id,expires_at);
--> statement-breakpoint
CREATE TABLE email_outbox (id varchar(64) PRIMARY KEY, recipient text NOT NULL, subject text NOT NULL, html text NOT NULL, attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(), locked_until timestamptz, sent_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX email_outbox_due ON email_outbox(next_attempt_at) WHERE sent_at IS NULL;
