ALTER TABLE smgCharacteristic ADD CONSTRAINT FK_smgc_c
FOREIGN KEY (characteristic_id) REFERENCES characteristic(id)
ON DELETE CASCADE;