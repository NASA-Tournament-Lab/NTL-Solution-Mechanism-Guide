ALTER TABLE characteristicTypeValue ADD CONSTRAINT FK_ctv_c
FOREIGN KEY (characteristic_id) REFERENCES characteristic(id)
ON DELETE CASCADE