ALTER TABLE characteristic ADD CONSTRAINT FK_c_ct
FOREIGN KEY (type_id) REFERENCES characteristictype(id);