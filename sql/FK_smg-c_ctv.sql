ALTER TABLE smgCharacteristic ADD CONSTRAINT FK_smgc_ctv
FOREIGN KEY (valuetype_id) REFERENCES characteristicTypeValue(id);